/* NOVA Supabase public client configuration.
 * Publishable keys are intended for browser use. Protect data with Supabase RLS.
 * Never place service_role or secret keys in this file or any GitHub Pages asset.
 */
(function (global) {
  "use strict";

  const SUPABASE_URL = "https://rzgfrsevwcukgicolrje.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WJw8-4w75bdE48NQmgCmbw_KvCVtDG3";

  global.NOVA_SUPABASE_CONFIG = Object.freeze({
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY
  });

  if (!global.supabase || typeof global.supabase.createClient !== "function") {
    console.error("[NOVA] Supabase SDK did not load. Check the network/CDN connection.");
    global.novaSupabase = null;
    return;
  }

  try {
    global.novaSupabase = global.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
    console.info("[NOVA] Supabase client initialized.");
  } catch (error) {
    global.novaSupabase = null;
    console.error("[NOVA] Supabase initialization failed:", error);
  }
})(window);
