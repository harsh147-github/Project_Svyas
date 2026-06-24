#!/usr/bin/env python3
"""Sushaasan launch simulation — 12-month statistical model, 3 scenarios.
Grounded in: Namma Kasa (200 reports/72h at launch, Bengaluru, garbage-only),
Pune metro ~7M, all-civic-issues, citizen reports + scraping + gov war room."""

import math

# ---- shared assumptions ----------------------------------------------------
SCRAPED_PER_DAY = 12          # social posts the scraper maps/day (post-fix), grows slightly
REPORTS_PER_ACTIVE_USER_MO = 1.4   # a civically-active user files ~1-2 reports/mo
ACTIVE_FRACTION = 0.32        # monthly-active share of cumulative installs
# cost model (USD/mo)
BASE_INFRA = 65               # Vercel Pro 20 + Apify 49 (Supabase free early)
SUPABASE_PRO_FROM = 25        # $25/mo once on Pro
COST_PER_REPORT = 0.011       # Anthropic classify+synth+copilot, blended
# founder time
LAUNCH_SETUP_H = 14           # one-time, month 1 (billing caps, keys, mailbox)

SCEN = {
    # name: (seed_installs, monthly_growth_start, growth_decay, viral_month, viral_mult,
    #         ward_onboard_per_mo, max_resolution_rate)
    "Conservative": dict(seed=400,  g0=0.55, decay=0.86, vmonth=None, vmult=1.0, wards=0.5, maxres=0.18),
    "Expected":     dict(seed=1200, g0=0.85, decay=0.88, vmonth=4,    vmult=1.8, wards=1.2, maxres=0.30),
    "Viral break":  dict(seed=2500, g0=1.25, decay=0.90, vmonth=2,    vmult=3.2, wards=2.5, maxres=0.42),
}

def run(p):
    rows = []
    installs = p["seed"]
    cum_installs = p["seed"]
    cum_reports = 0
    cum_solved = 0
    wards_live = 1.0
    g = p["g0"]
    for m in range(1, 13):
        # growth
        if m > 1:
            new = cum_installs * g
            if p["vmonth"] and m == p["vmonth"]:
                new *= p["vmult"]      # media/viral spike
            installs = new
            cum_installs += new
            g *= p["decay"]
        active = cum_installs * ACTIVE_FRACTION
        scraped = SCRAPED_PER_DAY * (1 + 0.04*m) * 30
        citizen = active * REPORTS_PER_ACTIVE_USER_MO
        reports = citizen + scraped
        cum_reports += reports
        # government resolution: ramps as wards onboard
        wards_live = min(58, wards_live + p["wards"])
        res_rate = p["maxres"] * (1 - math.exp(-wards_live/12))
        solved = reports * res_rate
        cum_solved += solved
        # cost
        supa = SUPABASE_PRO_FROM if cum_reports > 3000 else 0
        cost = BASE_INFRA + supa + reports*COST_PER_REPORT
        # founder hours/mo: setup + grievance-handling (scales sublinearly) + officer touch
        gh = (LAUNCH_SETUP_H if m == 1 else 0)
        gh += 6 + 0.0009*reports + wards_live*0.25      # weekly admin + officer relations
        rows.append(dict(m=m, installs=int(cum_installs), active=int(active),
                         reports=int(reports), cum_reports=int(cum_reports),
                         solved=int(solved), cum_solved=int(cum_solved),
                         wards=round(wards_live), cost=int(cost), hours=round(gh)))
    return rows

def fmt(n):
    return f"{n:,}"

for name, p in SCEN.items():
    rows = run(p)
    print(f"\n{'='*78}\n  SCENARIO: {name.upper()}\n{'='*78}")
    print(f"{'Mo':>2} {'Installs':>9} {'Active':>7} {'Reports/mo':>10} {'Solved/mo':>9} {'Wards':>5} {'$/mo':>6} {'Your hrs':>8}")
    for r in rows:
        print(f"{r['m']:>2} {fmt(r['installs']):>9} {fmt(r['active']):>7} {fmt(r['reports']):>10} {fmt(r['solved']):>9} {r['wards']:>5} {fmt(r['cost']):>6} {r['hours']:>8}")
    last = rows[-1]
    tot_cost = sum(r['cost'] for r in rows)
    tot_hours = sum(r['hours'] for r in rows)
    print(f"  -> Year 1 end: {fmt(last['installs'])} installs · {fmt(last['cum_reports'])} total reports · "
          f"{fmt(last['cum_solved'])} grievances solved")
    print(f"  -> Year 1 cost: ${fmt(tot_cost)} (~Rs {fmt(int(tot_cost*85))}) · Your time: {fmt(tot_hours)} hrs total "
          f"(~{tot_hours//52} hrs/week avg)")
