"""
Sushaasan — NIBM Digital Twin Synthesis Pipeline

Builds a runnable local MVP layer on top of the civic_posts and traffic_readings DB.
The goal is not to be the final AI system, but to demonstrate the full flow:

raw civic signals -> structured evidence -> issue clusters -> causal links ->
ranked interventions -> optimized solution -> dashboard-ready JSON

Usage:
    python pipeline/digital_twin.py
    python pipeline/digital_twin.py --status
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List


BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "data" / "sushaasan_nibm.db"
TEMPLATE_PATH = BASE_DIR / "data" / "seeds" / "nibm_digital_twin_demo.json"
OUTPUT_DIR = BASE_DIR / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "nibm_mvp_demo.json"
DASHBOARD_PAYLOAD_FILE = BASE_DIR / "dashboard" / "generated_mvp_data.js"


ROUTING = [
    {
        "level": "Citizen",
        "purpose": "Report friction, document recurring failure windows, protect gate discipline",
        "active": True,
    },
    {
        "level": "RWA / local forum",
        "purpose": "Aggregate society evidence and volunteer support",
        "active": True,
    },
    {
        "level": "Ward Office",
        "purpose": "Coordinate frontage, vending, and local operating protocol",
        "active": True,
    },
    {
        "level": "Traffic Police",
        "purpose": "Own curb control, towing, and turning discipline",
        "active": True,
    },
    {
        "level": "Municipal",
        "purpose": "Repair edge failures and remove physical obstructions",
        "active": True,
    },
    {
        "level": "City",
        "purpose": "Retune systemic movement once local chaos is suppressed",
        "active": True,
    },
    {
        "level": "State",
        "purpose": "Escalate only if corridor behavior reflects a wider policy or infrastructure issue",
        "active": False,
    },
]


CITIZEN_ROLES = [
    {
        "title": "Gate discipline stewards",
        "detail": "Societies keep entrances clear and report repeated blocking patterns.",
    },
    {
        "title": "Volunteer traffic marshals",
        "detail": "Short pilot windows during evening peak help stabilize turning movements until police arrive.",
    },
    {
        "title": "Business frontage coordinators",
        "detail": "Shops and mall operations maintain loading windows and no-stop frontage zones.",
    },
    {
        "title": "Signal truth reporters",
        "detail": "Citizens keep feeding real peak-hour breakdown windows so the system learns actual trigger times.",
    },
]


VIDEO_SCENES = [
    {
        "id": "scene_01",
        "title": "Hook",
        "time": "0-10s",
        "caption": "India doesn't lack opinions. It lacks a system that can turn them into solutions.",
    },
    {
        "id": "scene_02",
        "title": "Scattered internet signals",
        "time": "10-25s",
        "caption": "Reels, reviews, local news, resident forums, traffic APIs, field notes — all saying something, nowhere connecting.",
    },
    {
        "id": "scene_03",
        "title": "NIBM as a digital twin",
        "time": "25-38s",
        "caption": "This is not one traffic complaint. This is a living governance system under stress.",
    },
    {
        "id": "scene_04",
        "title": "Root-cause reveal",
        "time": "38-50s",
        "caption": "Illegal parking, construction spillover, encroachment, pedestrian failure, enforcement timing mismatch.",
    },
    {
        "id": "scene_05",
        "title": "Optimized action output",
        "time": "50-70s",
        "caption": "Sushaasan ranks what to do first, who should own it, and how citizens help execute it.",
    },
    {
        "id": "scene_06",
        "title": "Scale-out",
        "time": "70-82s",
        "caption": "Today NIBM. Tomorrow every ward, city, and state.",
    },
    {
        "id": "scene_07",
        "title": "CTA",
        "time": "82-90s",
        "caption": "Share it. Support it. Help Sushaasan reach the whole nation.",
    },
]


HOTSPOT_META = {
    "cluster_01": {"id": "hot_01", "label": "Tribeca Gate", "x": 68, "y": 34, "blurb": "Parking spillover + pedestrian conflict"},
    "cluster_03": {"id": "hot_02", "label": "Kausarbaug Junction", "x": 75, "y": 50, "blurb": "Choke point where unmanaged curb use becomes corridor-wide jam"},
    "cluster_02": {"id": "hot_03", "label": "Mohamadwadi T-Point", "x": 57, "y": 63, "blurb": "Construction vehicle entry + narrow turning conflict"},
    "cluster_05": {"id": "hot_04", "label": "NIBM Junction", "x": 41, "y": 22, "blurb": "Overloaded upstream node amplifying downstream disruptions"},
}


CLUSTER_RULES = {
    "cluster_01": {
        "issues": {"illegal_parking", "no_parking_facility"},
        "geo": {"tribeca", "high street", "shoppers stop", "kausarbaug"},
    },
    "cluster_02": {
        "issues": {"heavy_vehicle", "construction_block"},
        "geo": {"mohamadwadi", "lodha", "tanker"},
    },
    "cluster_03": {
        "issues": {"encroachment"},
        "geo": {"kausarbaug", "parge nagar", "ramzan", "stall", "vendor"},
    },
    "cluster_04": {
        "issues": {"road_condition", "drainage_sewage", "pedestrian_safety", "infrastructure_gap", "road_obstruction"},
        "geo": {"tribeca", "entrance", "footpath", "anandpur"},
    },
    "cluster_05": {
        "issues": {"no_enforcement", "enforcement_gap", "peak_hour_gridlock", "traffic_congestion", "safety_hazard"},
        "geo": {"nibm", "kondhwa", "kausarbaug", "junction"},
    },
}


PRIORITY_SCORE = {"critical": 4, "high": 3, "medium": 2, "low": 1}
SOURCE_TYPE_MAP = {
    "instagram": "Instagram reel",
    "news": "Local news",
    "google_maps": "GMaps review",
    "gmaps_review": "GMaps review",
    "manual": "Manual intelligence",
    "reddit": "Reddit discussion",
    "twitter": "X / Twitter",
    "whatsapp": "Resident forum",
}


def connect_db() -> sqlite3.Connection:
    if not DB_PATH.exists() or DB_PATH.stat().st_size == 0:
        raise RuntimeError("Database not initialized. Run ingestion first.")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def load_template() -> Dict[str, Any]:
    return json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))


def parse_json_value(value: Any, fallback: Any) -> Any:
    if value in (None, "", "null"):
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return fallback


def fetch_posts(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT *
        FROM civic_posts
        ORDER BY
          CASE priority
            WHEN 'critical' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            ELSE 1
          END DESC,
          virality_score DESC,
          timestamp DESC
        """
    ).fetchall()
    posts = []
    for row in rows:
        item = dict(row)
        item["issues"] = parse_json_value(item.get("issues"), [])
        item["mentioned_landmarks"] = parse_json_value(item.get("mentioned_landmarks"), [])
        item["raw"] = parse_json_value(item.get("raw"), {})
        posts.append(item)
    return posts


def fetch_traffic_readings(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT *
        FROM traffic_readings
        ORDER BY timestamp DESC
        LIMIT 12
        """
    ).fetchall()
    readings = []
    for row in rows:
        item = dict(row)
        item["raw"] = parse_json_value(item.get("raw"), {})
        readings.append(item)
    return readings


def post_text_blob(post: Dict[str, Any]) -> str:
    blobs = [
        post.get("text", ""),
        post.get("text_cleaned", ""),
        post.get("subarea", ""),
        post.get("area", ""),
        " ".join(post.get("mentioned_landmarks", []) or []),
    ]
    return " ".join(blobs).lower()


def cluster_match(post: Dict[str, Any], cluster_id: str) -> bool:
    rules = CLUSTER_RULES[cluster_id]
    issues = set(post.get("issues", []) or [])
    blob = post_text_blob(post)
    return bool(issues.intersection(rules["issues"])) or any(token in blob for token in rules["geo"])


def build_source_evidence(posts: List[Dict[str, Any]], traffic_readings: List[Dict[str, Any]], template: Dict[str, Any]) -> List[Dict[str, Any]]:
    chosen: List[Dict[str, Any]] = []
    covered_sources = set()

    for post in posts:
        source = post.get("source", "")
        if source in covered_sources and source not in {"news"}:
            continue
        covered_sources.add(source)
        chosen.append(
            {
                "id": post["id"],
                "sourceType": SOURCE_TYPE_MAP.get(source, source.replace("_", " ").title()),
                "handle": post.get("author_handle") or "public_signal",
                "title": (post.get("source_url") or post.get("source_post_id") or post.get("text", "")[:64]).split("/")[-1][:80] or f"{source} evidence",
                "summary": (post.get("text_english") or post.get("text") or "")[:190].strip(),
                "excerpt": (post.get("text") or "")[:220].strip(),
                "timestamp": post.get("timestamp") or post.get("collected_at") or datetime.now(timezone.utc).isoformat(),
                "confidence": round(min(0.98, 0.55 + post.get("confidence", 0.0) * 0.4), 2),
                "geoRelevance": post.get("subarea") or ", ".join((post.get("mentioned_landmarks") or [])[:2]) or post.get("area") or "NIBM Road",
                "url": post.get("source_url") or post.get("source_post_id") or "",
            }
        )
        if len(chosen) >= 5:
            break

    if traffic_readings:
        latest = traffic_readings[0]
        chosen.append(
            {
                "id": latest["id"],
                "sourceType": "Traffic reading",
                "handle": latest.get("source", "traffic_api"),
                "title": latest.get("segment_name", "Corridor slowdown snapshot"),
                "summary": f"{latest.get('status', 'unknown').replace('_', ' ').title()} at {latest.get('speed_kmh', 0)} km/h with congestion ratio {latest.get('congestion_ratio', 0)}.",
                "excerpt": json.dumps(latest.get("raw", {}), ensure_ascii=False)[:220],
                "timestamp": latest.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "confidence": 0.76,
                "geoRelevance": latest.get("segment_name", "NIBM corridor"),
                "url": "api://google_maps_live/nibm-corridor",
            }
        )

    # Fill any missing evidence slot from the domain template so the story remains complete.
    existing_types = {item["sourceType"] for item in chosen}
    for item in template.get("source_evidence", []):
        source_type = item["source_type"].replace("_", " ").title()
        normalized = {
            "Instagram Reel": "Instagram reel",
            "Local News": "Local news",
            "Gmaps Review": "GMaps review",
            "Resident Forum": "Resident forum",
            "Manual Intelligence": "Manual intelligence",
            "Traffic Reading": "Traffic reading",
        }.get(source_type, source_type)
        if normalized in existing_types:
            continue
        chosen.append(
            {
                "id": item["id"],
                "sourceType": normalized,
                "handle": "template_signal",
                "title": item["title"],
                "summary": item["summary"],
                "excerpt": item["summary"],
                "timestamp": item["timestamp"],
                "confidence": item["confidence"],
                "geoRelevance": item["geo_relevance"],
                "url": "",
            }
        )
        existing_types.add(normalized)
        if len(chosen) >= 6:
            break

    return chosen[:6]


def build_clusters(posts: List[Dict[str, Any]], template: Dict[str, Any], evidence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    total_posts = max(len(posts), 1)
    clusters = []
    evidence_by_geo = defaultdict(list)
    for ev in evidence:
        evidence_by_geo[ev["geoRelevance"].lower()].append(ev["id"])

    for cluster in template.get("issue_clusters", []):
        matched = [post for post in posts if cluster_match(post, cluster["id"])]
        matched_count = len(matched)
        priority_total = sum(PRIORITY_SCORE.get(post.get("priority", "low"), 1) for post in matched)
        avg_priority = priority_total / matched_count if matched_count else 0
        confidence = round(min(0.98, 0.52 + matched_count * 0.05 + avg_priority * 0.04), 2) if matched_count else 0.42
        signal_share = f"{round((matched_count / total_posts) * 100)}%"
        causes = {
            "cluster_01": [
                "No active curb management during peak retail windows",
                "Parking demand spills into the road edge",
                "Vehicles occupy society gates and pavement frontage",
            ],
            "cluster_02": [
                "No holding zone for heavy vehicles",
                "Construction and tanker movement overlaps with school and office traffic",
                "Repeated violations produce normalized bad behavior",
            ],
            "cluster_03": [
                "Road-edge vending with no event management protocol",
                "Pedestrian overflow into the carriageway",
                "No temporary circulation plan during high-footfall windows",
            ],
            "cluster_04": [
                "Poor roadside maintenance",
                "No protected pedestrian channel near busy entry points",
                "Storefront edge conditions discourage formal walking paths",
            ],
            "cluster_05": [
                "Peak-hour constable coverage is inconsistent",
                "Signal / turning discipline is not tuned to current demand",
                "Recurring chokepoints are treated as isolated incidents instead of a system",
            ],
        }[cluster["id"]]

        authorities = {
            "cluster_01": ["Kondhwa Traffic Division", "Ward Office", "Tribeca management"],
            "cluster_02": ["Traffic Police", "PMC Ward Engineering", "Builder / site logistics"],
            "cluster_03": ["Ward Office", "Encroachment Dept", "Traffic Police"],
            "cluster_04": ["PMC Road / Drainage", "Mall operations"],
            "cluster_05": ["Kondhwa Traffic Division", "City traffic engineering"],
        }[cluster["id"]]

        citizen_role = {
            "cluster_01": "Residents and shop owners enforce gate discipline and shift to marked loading windows.",
            "cluster_02": "RWAs log vehicle entry windows and share recurring violators with the ward desk.",
            "cluster_03": "Residents and volunteers support temporary lane discipline and event-day circulation rules.",
            "cluster_04": "Report blocked footpaths and maintain a shared no-obstruction frontage code.",
            "cluster_05": "Volunteer marshals support controlled entry and document repeat breakdown windows.",
        }[cluster["id"]]

        cluster_evidence_ids = []
        zone_blob = cluster.get("affected_zone", "").lower()
        for ev in evidence:
            if ev["geoRelevance"].lower() in zone_blob or any(token in ev["summary"].lower() for token in zone_blob.split()):
                cluster_evidence_ids.append(ev["id"])
        if not cluster_evidence_ids and cluster.get("contributing_sources"):
            cluster_evidence_ids = cluster["contributing_sources"][:]
        if not cluster_evidence_ids and evidence:
            cluster_evidence_ids = [evidence[0]["id"]]

        clusters.append(
            {
                "id": cluster["id"],
                "title": cluster["title"],
                "severity": cluster["severity"],
                "affectedZone": cluster["affected_zone"],
                "signalShare": signal_share,
                "summary": cluster["summary"],
                "causes": causes,
                "authorities": authorities,
                "citizenRole": citizen_role,
                "confidence": confidence,
                "contributorCount": matched_count,
                "evidenceIds": cluster_evidence_ids,
            }
        )
    return clusters


def build_hotspots(clusters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    hotspots = []
    for cluster in clusters:
        meta = HOTSPOT_META.get(cluster["id"])
        if not meta:
            continue
        contributor_count = max(cluster.get("contributorCount", 0), 1)
        intensity = round(min(0.99, 0.58 + contributor_count * 0.05), 2)
        hotspots.append(
            {
                "id": meta["id"],
                "label": meta["label"],
                "clusterIds": [cluster["id"]],
                "x": meta["x"],
                "y": meta["y"],
                "intensity": intensity,
                "blurb": meta["blurb"],
            }
        )
    return hotspots


def build_interventions(template: Dict[str, Any]) -> List[Dict[str, Any]]:
    out = []
    for item in template.get("intervention_options", []):
        out.append(
            {
                "id": item["id"],
                "rank": item["rank"],
                "title": item["title"],
                "ownerAuthority": item["owner_authority"],
                "requiredCoordination": item["required_coordination"],
                "citizenRole": item["citizen_role"],
                "feasibility": item["feasibility"],
                "expectedImpact": item["expected_impact"],
                "executionHorizon": item["execution_horizon"],
                "procedureAware": (
                    "Starts with locally executable operational actions first, then escalates only where corridor redesign or city retiming is justified."
                    if item["rank"] == 1
                    else "Designed as a coordinated next step once the previous operational layer is active."
                ),
            }
        )
    return out


def build_optimized_solution(template: Dict[str, Any]) -> Dict[str, Any]:
    base = template.get("optimized_solution", {})
    return {
        "title": base.get("title", "NIBM coordinated decongestion strategy"),
        "primaryStrategy": base.get("primary_strategy", ""),
        "supportingActions": base.get("supporting_actions", []),
        "routingPath": base.get("routing_path", []),
        "whyBest": base.get("why_best", ""),
        "citizenRole": base.get("citizen_role", ""),
        "expectedOutcome": "A visible pilot proving that scattered internet discourse can be converted into executable, shared civic action.",
        "confidence": base.get("confidence", 0.88),
    }


def build_metrics(posts: List[Dict[str, Any]], clusters: List[Dict[str, Any]], interventions: List[Dict[str, Any]], template: Dict[str, Any]) -> List[Dict[str, Any]]:
    evidence_channel_count = len({post.get("source") for post in posts})
    actors_count = len(template.get("execution_actors", []))
    return [
        {
            "label": "Signals Synthesized",
            "value": str(len(posts)),
            "note": "reels, news, reviews, resident comments, manual logs, traffic readings",
            "tone": "primary",
        },
        {
            "label": "Root Causes",
            "value": str(len(clusters)),
            "note": "small failures driving the NIBM bottleneck",
            "tone": "accent",
        },
        {
            "label": "Priority Interventions",
            "value": str(len(interventions)),
            "note": "ranked coordinated actions for ward + traffic police + citizens",
            "tone": "warning",
        },
        {
            "label": "Execution Actors",
            "value": str(actors_count),
            "note": f"{evidence_channel_count} active source channels feeding the current pilot",
            "tone": "success",
        },
    ]


def write_synthesis_to_db(
    conn: sqlite3.Connection,
    evidence: List[Dict[str, Any]],
    clusters: List[Dict[str, Any]],
    interventions: List[Dict[str, Any]],
    optimized_solution: Dict[str, Any],
    template: Dict[str, Any],
) -> None:
    conn.executescript(
        """
        DELETE FROM source_evidence;
        DELETE FROM issue_clusters;
        DELETE FROM causal_links;
        DELETE FROM intervention_options;
        DELETE FROM optimized_solutions;
        """
    )

    for item in evidence:
        conn.execute(
            """
            INSERT INTO source_evidence (
                id, source_type, source_ref_id, source_url, title, summary, excerpt,
                timestamp, confidence, geo_relevance, area, subarea, raw
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item["id"],
                item["sourceType"].lower().replace(" / ", "_").replace(" ", "_"),
                item["id"],
                item.get("url", ""),
                item["title"],
                item["summary"],
                item["excerpt"],
                item["timestamp"],
                item["confidence"],
                item["geoRelevance"],
                "NIBM Road",
                item["geoRelevance"],
                json.dumps(item, ensure_ascii=False),
            ),
        )

    for item in clusters:
        conn.execute(
            """
            INSERT INTO issue_clusters (
                id, title, severity, affected_zone, governance_level, summary,
                evidence_ids, evidence_count, contributor_count, signal_share, confidence, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item["id"],
                item["title"],
                item["severity"],
                item["affectedZone"],
                "ward",
                item["summary"],
                json.dumps(item["evidenceIds"], ensure_ascii=False),
                len(item["evidenceIds"]),
                item["contributorCount"],
                float(item["signalShare"].replace("%", "")) / 100.0,
                item["confidence"],
                "active",
            ),
        )

    for item in template.get("causal_links", []):
        conn.execute(
            """
            INSERT INTO causal_links (
                id, cluster_id, cause_node, effect_node, confidence, explanation
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                item["id"],
                {
                    "link_01": "cluster_01",
                    "link_02": "cluster_01",
                    "link_03": "cluster_02",
                    "link_04": "cluster_04",
                    "link_05": "cluster_05",
                }.get(item["id"], "cluster_05"),
                item["cause_node"],
                item["effect_node"],
                item["confidence"],
                item["explanation"],
            ),
        )

    for item in interventions:
        conn.execute(
            """
            INSERT INTO intervention_options (
                id, cluster_id, rank_order, title, owner_authority, required_coordination,
                citizen_role, feasibility, expected_impact, execution_horizon,
                procedure_notes, ranking_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item["id"],
                f"cluster_0{item['rank']}" if item["rank"] < 5 else "cluster_05",
                item["rank"],
                item["title"],
                item["ownerAuthority"],
                json.dumps(item["requiredCoordination"], ensure_ascii=False),
                item["citizenRole"],
                item["feasibility"],
                item["expectedImpact"],
                item["executionHorizon"],
                item["procedureAware"],
                float(10 - item["rank"]),
            ),
        )

    conn.execute(
        """
        INSERT INTO optimized_solutions (
            id, primary_cluster_id, title, primary_strategy, supporting_actions,
            routing_path, why_best, citizen_role, expected_outcome, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "solution_01",
            "cluster_05",
            optimized_solution["title"],
            optimized_solution["primaryStrategy"],
            json.dumps(optimized_solution["supportingActions"], ensure_ascii=False),
            json.dumps(optimized_solution["routingPath"], ensure_ascii=False),
            optimized_solution["whyBest"],
            optimized_solution["citizenRole"],
            optimized_solution["expectedOutcome"],
            optimized_solution["confidence"],
        ),
    )

    conn.commit()


def export_dashboard_json(
    posts: List[Dict[str, Any]],
    evidence: List[Dict[str, Any]],
    clusters: List[Dict[str, Any]],
    interventions: List[Dict[str, Any]],
    optimized_solution: Dict[str, Any],
    template: Dict[str, Any],
) -> Dict[str, Any]:
    top_sources = Counter(post.get("source", "unknown") for post in posts)
    overview = {
        "productName": "Sushaasan",
        "productTagline": "Governance Digital Twin for Indian Public Reality",
        "region": "NIBM Traffic Management Region",
        "locationLine": "NIBM Road -> Kausarbaug -> Tribeca High Street -> Mohamadwadi, Pune",
        "hook": "India doesn't lack opinions. It lacks a system that can turn them into solutions.",
        "thesis": (
            "Sushaasan is not a grievance app. It is a governance intelligence engine that ingests scattered public inputs "
            "and outputs coordinated, procedure-aware solutions."
        ),
        "status": "Runnable Local MVP",
        "livePulse": f"Signal synthesis active across {len(top_sources)} channels from the current local database",
        "lastRunAt": datetime.now(timezone.utc).isoformat(),
    }
    payload = {
        "overview": overview,
        "metrics": build_metrics(posts, clusters, interventions, template),
        "sources": evidence,
        "hotspots": build_hotspots(clusters),
        "clusters": clusters,
        "causalLinks": template.get("causal_links", []),
        "interventions": interventions,
        "optimizedSolution": optimized_solution,
        "routing": ROUTING,
        "citizenRoles": CITIZEN_ROLES,
        "videoScenes": VIDEO_SCENES,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    DASHBOARD_PAYLOAD_FILE.write_text(
        "window.SUSHAASAN_MVP_DATA = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    return payload


def build_digital_twin() -> Dict[str, Any]:
    template = load_template()
    conn = connect_db()
    try:
        posts = fetch_posts(conn)
        traffic = fetch_traffic_readings(conn)
        if not posts:
            raise RuntimeError("No civic_posts found. Run ingestion first.")
        evidence = build_source_evidence(posts, traffic, template)
        clusters = build_clusters(posts, template, evidence)
        interventions = build_interventions(template)
        optimized_solution = build_optimized_solution(template)
        write_synthesis_to_db(conn, evidence, clusters, interventions, optimized_solution, template)
        payload = export_dashboard_json(posts, evidence, clusters, interventions, optimized_solution, template)
        return payload
    finally:
        conn.close()


def show_status() -> None:
    if not OUTPUT_FILE.exists():
        print("No processed MVP data found. Run: python pipeline/digital_twin.py")
        return
    data = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
    print("\n" + "=" * 62)
    print("SUSHAASAN DIGITAL TWIN MVP STATUS")
    print("=" * 62)
    print("Region:", data["overview"]["region"])
    print("Status:", data["overview"]["status"])
    print("Signals:", data["metrics"][0]["value"])
    print("Clusters:", len(data["clusters"]))
    print("Interventions:", len(data["interventions"]))
    print("Output:", OUTPUT_FILE)
    print("Dashboard payload:", DASHBOARD_PAYLOAD_FILE)
    print("=" * 62 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build NIBM digital twin MVP outputs")
    parser.add_argument("--status", action="store_true", help="Show current MVP synthesis status")
    args = parser.parse_args()

    if args.status:
        show_status()
        return

    payload = build_digital_twin()
    print("\n" + "=" * 62)
    print("DIGITAL TWIN MVP BUILD COMPLETE")
    print("=" * 62)
    print("Signals synthesized:", payload["metrics"][0]["value"])
    print("Root-cause clusters:", len(payload["clusters"]))
    print("Interventions ranked:", len(payload["interventions"]))
    print("Dashboard payload:", OUTPUT_FILE)
    print("Browser asset:", DASHBOARD_PAYLOAD_FILE)
    print("=" * 62 + "\n")


if __name__ == "__main__":
    main()
