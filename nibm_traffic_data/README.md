# Sushaasan NIBM MVP

This folder now contains a runnable local MVP for the NIBM proof case.

The MVP flow is:

1. collect or seed scattered civic signals
2. ingest them into SQLite
3. synthesize digital-twin outputs
4. render the outputs in the dashboard

## What this MVP proves

- Sushaasan is not a grievance tracker
- scattered internet inputs can be normalized into one evidence layer
- the system can surface root-cause clusters, causal chains, and ranked interventions
- the output can route action across citizen, ward, traffic police, municipal, and city levels

## Run it

From `nibm_traffic_data`:

```powershell
python run_mvp.py
```

To build and open the dashboard:

```powershell
python run_mvp.py --open
```

To inspect the latest processed MVP status:

```powershell
python run_mvp.py --status
```

## Main files

- `run_mvp.py`: one-command local MVP bootstrap
- `pipeline/ingestion.py`: raw signal -> SQLite ingestion
- `pipeline/digital_twin.py`: SQLite -> evidence, clusters, interventions, dashboard payload
- `dashboard/sushaasan_dashboard.html`: local UI for the MVP
- `dashboard/generated_mvp_data.js`: generated dashboard payload after a build
- `data/processed/nibm_mvp_demo.json`: generated processed output for inspection

## Current truth model

This is a demo MVP, not the final AI product.

- raw civic signals are real seed inputs and collector-ready inputs
- the digital-twin synthesis layer is rule-based for now
- the dashboard is driven by generated MVP output, with a fallback presentation seed if the build has not been run yet

That gives you something honest enough to test, demo, and iterate before turning it into a fuller production system.
