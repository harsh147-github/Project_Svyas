# Vercel root directory

**Production (recommended)**  
Link the Vercel project to the **Git repository root** (e.g. `Project_Svyas` / `Project-Svyas`). Leave **Root Directory** empty (`.`).  
Use the **`vercel.json` next to this file’s parent** (repo root: `../vercel.json`) so `install` / `build` run under `sushasan/apps/web/` while **all env vars stay on that one Vercel project**.

**Do not** set Vercel **Root Directory** to `sushasan/apps/web` or `apps/web` only — that splits deployment from the main project and you lose the shared environment configuration.

**Alternate (subfolder only)**  
If you ever point Vercel **Root Directory** at `sushasan/` only, then the active config is `sushasan/vercel.json` (paths are `cd apps/web && …`).
