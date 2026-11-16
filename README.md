# NOVA Social

NOVA is a next-generation AI-powered social platform with a built-in video studio.
Static site published with **GitHub Pages** (branch `main`, folder `/ (root)`).

## Folder structure

```text
NOVA-Social/
├── index.html
├── README.md
├── PACKAGE-MANIFEST.json
├── .nojekyll
└── assets/
    ├── css/        11 stylesheets (numbered = load order)
    ├── js/         10 scripts (numbered = load order + supabase-config.js)
    ├── images/     nova-logo.png
    ├── icons/      (empty for now)
    └── fonts/      (empty for now)
```

## Important rules

- **Do not rename or reorder** the numbered CSS/JS files. The numbers are the load order used by `index.html`.
- Keep `index.html` at the repository root and keep the `assets/` folder names.
- Keep `.nojekyll` in the root.

## Supabase

Public project URL and **publishable** key are in `assets/js/supabase-config.js`.
After loading, the client is available as `window.novaSupabase`.

- A publishable key (`sb_publishable_...`) may be visible in the browser. Row Level Security (RLS) is the security boundary.
- **Never** put a `sb_secret_...` or `service_role` key in any file of this repository.
- The current code only initializes the client. Accounts, posts, messages and storage are not yet connected to Supabase tables.

## Publish

1. Upload the files to the repository (keep the folder layout above).
2. Settings -> Pages -> Source: Deploy from a branch -> `main` / `/ (root)`.
3. Open: https://rysadaro2929-sudo.github.io/NOVA-Social/

External resources that need internet: Google Fonts and the Supabase SDK (jsDelivr).
