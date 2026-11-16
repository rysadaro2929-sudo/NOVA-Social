/* KAISOR AI Smart Clip - local visual-analysis prototype.
   This is heuristic video analysis, not semantic AI understanding.
   Cloud enhancement is optional and must be provided by a trusted backend. */
(function (global) {
  "use strict";

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function waitForEvent(target, eventName) {
    return new Promise((resolve, reject) => {
      const onOk = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(new Error("មិនអាចអានវីដេអូបានទេ។")); };
      const cleanup = () => {
        target.removeEventListener(eventName, onOk);
        target.removeEventListener("error", onErr);
      };
      target.addEventListener(eventName, onOk, { once: true });
      target.addEventListener("error", onErr, { once: true });
    });
  }

  function seekTo(video, time) {
    return new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - time) < 0.04) return resolve();
      const done = () => { cleanup(); resolve(); };
      const fail = () => { cleanup(); reject(new Error("ការរំកិលទៅពេលវេលានេះបរាជ័យ។")); };
      const cleanup = () => {
        video.removeEventListener("seeked", done);
        video.removeEventListener("error", fail);
      };
      video.addEventListener("seeked", done, { once: true });
      video.addEventListener("error", fail, { once: true });
      video.currentTime = time;
    });
  }

  function frameSignature(ctx, width, height) {
    const image = ctx.getImageData(0, 0, width, height);
    const data = image.data;
    const bins = new Array(16).fill(0);
    let sum = 0, edge = 0, diff = 0, count = 0;
    const gray = new Uint8Array(width * height);
    for (let p = 0, i = 0; p < data.length; p += 4, i++) {
      const y = Math.round((data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114));
      gray[i] = y;
      bins[y >> 4]++;
      sum += y;
    }
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const i = y * width + x;
        const d = Math.abs(gray[i] - gray[i - 1]) + Math.abs(gray[i] - gray[i - width]);
        edge += d;
        count++;
      }
    }
    for (let i = 0; i < bins.length; i++) bins[i] /= (width * height);
    return { bins, mean: sum / (width * height), edge: count ? edge / count : 0, gray };
  }

  function signatureDifference(a, b) {
    let hist = 0;
    for (let i = 0; i < a.bins.length; i++) hist += Math.abs(a.bins[i] - b.bins[i]);
    let pixel = 0;
    const step = 7;
    for (let i = 0; i < a.gray.length; i += step) pixel += Math.abs(a.gray[i] - b.gray[i]) / 255;
    pixel /= Math.ceil(a.gray.length / step);
    return clamp(hist * 0.48 + pixel * 0.52, 0, 1);
  }

  async function analyzeVideo(video, options, onProgress) {
    options = options || {};
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration < 1) throw new Error("វីដេអូខ្លីពេក ឬមិនអាចអានរយៈពេលបាន។");

    const sampleEvery = options.sampleEvery || 1.25;
    const maxSamples = options.maxSamples || 240;
    const count = Math.min(maxSamples, Math.max(2, Math.ceil(duration / sampleEvery)));
    const interval = duration / count;
    const width = 96, height = 54;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const samples = [];
    const oldTime = video.currentTime;
    const wasPaused = video.paused;
    video.pause();

    try {
      for (let i = 0; i < count; i++) {
        if (options.signal && options.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        const time = Math.min(Math.max(0, i * interval), Math.max(0, duration - 0.08));
        await seekTo(video, time);
        ctx.drawImage(video, 0, 0, width, height);
        const sig = frameSignature(ctx, width, height);
        samples.push({ time, sig, thumbnail: canvas.toDataURL("image/jpeg", 0.48) });
        if (onProgress) onProgress(Math.round(((i + 1) / count) * 85), `កំពុងវិភាគរូបភាព ${i + 1}/${count}`);
        await new Promise(r => setTimeout(r, 0));
      }
    } finally {
      try { await seekTo(video, Math.min(oldTime, Math.max(0, duration - 0.05))); } catch (_) {}
      if (!wasPaused) video.play().catch(() => {});
    }

    const sensitivity = options.sensitivity || "medium";
    const cutThreshold = sensitivity === "high" ? 0.20 : sensitivity === "low" ? 0.34 : 0.26;
    const changes = [];
    for (let i = 1; i < samples.length; i++) {
      changes.push(signatureDifference(samples[i - 1].sig, samples[i].sig));
    }

    const boundaries = [0];
    for (let i = 1; i < samples.length - 1; i++) {
      if (changes[i] >= cutThreshold && samples[i].time - boundaries[boundaries.length - 1] >= 2.0) {
        boundaries.push(samples[i].time);
      }
    }
    boundaries.push(duration);

    let scenes = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i], end = boundaries[i + 1];
      if (end - start < 1.5) continue;
      const subset = samples.filter(s => s.time >= start && s.time < end);
      if (!subset.length) continue;
      const motions = [];
      for (let j = 1; j < subset.length; j++) {
        const idx = samples.indexOf(subset[j]);
        motions.push(changes[Math.max(0, idx - 1)] || 0);
      }
      const avgMotion = motions.length ? motions.reduce((a,b) => a+b,0)/motions.length : 0;
      const avgEdge = subset.reduce((a,s) => a + s.sig.edge, 0) / subset.length;
      const visualVariety = clamp(avgMotion * 1.8, 0, 1);
      const visualDetail = clamp(avgEdge / 70, 0, 1);
      const lengthFit = clamp(1 - Math.abs((end-start)-8)/18, 0.25, 1);
      const score = Math.round((visualVariety * 0.55 + visualDetail * 0.25 + lengthFit * 0.20) * 100);
      scenes.push({
        id: `local-${i + 1}`,
        start: Math.max(0, start),
        end: Math.min(duration, end),
        score,
        motion: Math.round(visualVariety * 100),
        reason: "ចំណាត់ថ្នាក់តាមចលនា និងភាពខុសគ្នានៃរូបភាព",
        thumbnail: subset[Math.floor(subset.length / 2)].thumbnail,
        source: "local"
      });
    }

    // If there are only a few long scenes, split them into useful short candidates.
    const expanded = [];
    scenes.forEach(scene => {
      const length = scene.end - scene.start;
      if (length > 16) {
        const chunk = 8;
        for (let t = scene.start; t < scene.end; t += chunk) {
          const end = Math.min(scene.end, t + chunk);
          if (end - t >= 3) expanded.push({ ...scene, id: `${scene.id}-${expanded.length+1}`, start: t, end, score: scene.score });
        }
      } else expanded.push(scene);
    });

    expanded.sort((a,b) => b.score - a.score);
    if (onProgress) onProgress(100, "វិភាគ Local រួចរាល់");
    return { duration, scenes: expanded, sampleCount: samples.length, engine: "LOCAL HEURISTIC" };
  }

  function chooseHighlights(scenes, targetSeconds) {
    const sorted = scenes.slice().sort((a,b) => b.score - a.score);
    const chosen = [];
    let total = 0;
    for (const scene of sorted) {
      const length = scene.end - scene.start;
      if (length < 1.5 || total >= targetSeconds) continue;
      const take = Math.min(length, targetSeconds - total);
      if (take < 1.5) continue;
      chosen.push({ ...scene, end: scene.start + take, selected: true });
      total += take;
    }
    chosen.sort((a,b) => a.start - b.start);
    return chosen;
  }

  async function enhanceWithCloud(endpoint, analysis, videoInfo, instruction) {
    if (!endpoint) return null;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: "rank_video_highlights",
        instruction: typeof instruction === "string" ? instruction.slice(0, 2000) : "",
        video: videoInfo,
        candidates: analysis.scenes.map(s => ({
          id: s.id, start: s.start, end: s.end, local_score: s.score,
          thumbnail_jpeg_data_url: s.thumbnail
        }))
      })
    });
    if (!response.ok) throw new Error(`Cloud AI server error: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.highlights)) throw new Error("Cloud AI response មិនមាន highlights array ទេ។");
    const byId = new Map(analysis.scenes.map(s => [s.id, s]));
    return data.highlights.map((h, i) => {
      const base = byId.get(h.id);
      if (!base) return null;
      return {
        ...base,
        score: Number.isFinite(Number(h.score)) ? clamp(Number(h.score), 0, 100) : base.score,
        reason: typeof h.reason === "string" ? h.reason.slice(0, 180) : "Cloud AI highlight",
        source: "cloud"
      };
    }).filter(Boolean).sort((a,b) => b.score - a.score);
  }

  global.KAISORAI = { analyzeVideo, chooseHighlights, enhanceWithCloud };
})(window);
