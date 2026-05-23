const DEMO_SEED = {
  overview: {
    productName: "Sushaasan",
    productTagline: "Governance Digital Twin for Indian Public Reality",
    region: "NIBM Traffic Management Region",
    locationLine: "NIBM Road -> Kausarbaug -> Tribeca High Street -> Mohamadwadi, Pune",
    hook: "India doesn't lack opinions. It lacks a system that can turn them into solutions.",
    thesis:
      "Sushaasan is not a grievance app. It is a governance intelligence engine that ingests scattered public inputs and outputs coordinated, procedure-aware solutions.",
    status: "Believable MVP Demo",
    livePulse: "Signal synthesis active across 6 scattered-source channels",
  },
  metrics: [
    {
      label: "Signals Synthesized",
      value: "182",
      note: "reels, news, reviews, resident comments, manual logs, traffic readings",
      tone: "primary",
    },
    {
      label: "Root Causes",
      value: "5",
      note: "small failures driving the NIBM bottleneck",
      tone: "accent",
    },
    {
      label: "Priority Interventions",
      value: "4",
      note: "ranked coordinated actions for ward + traffic police + citizens",
      tone: "warning",
    },
    {
      label: "Execution Actors",
      value: "7",
      note: "traffic police, ward office, PMC, RWAs, mall ops, residents, volunteers",
      tone: "success",
    },
  ],
  sources: [
    {
      id: "src_01",
      sourceType: "Instagram reel",
      handle: "@punepulse",
      title: "Kausarbaug evening choke reel",
      summary:
        "Residents clear traffic themselves while vehicles are double parked outside the commercial strip.",
      excerpt:
        "Late evening jam. No decongestion till local residents stepped in. Cars parked on pavements, entry gates blocked, no visible police.",
      timestamp: "2026-03-08T19:40:00+05:30",
      confidence: 0.97,
      geoRelevance: "Kausarbaug junction",
      url: "https://www.instagram.com/reel/DVm_H7aiDAu/",
    },
    {
      id: "src_02",
      sourceType: "Local news",
      handle: "PunePulse",
      title: "Illegal parking near Tribeca",
      summary:
        "Repeated reporting around roadside parking outside Tribeca High Street narrowing the carriageway.",
      excerpt:
        "Persistent illegal parking despite no-parking boards. Traffic flow obstructed. Pedestrian inconvenience and safety hazard growing.",
      timestamp: "2025-03-15T10:00:00+05:30",
      confidence: 0.92,
      geoRelevance: "Tribeca High Street gate",
      url: "https://www.mypunepulse.com/pune-residents-demand-strict-action-against-illegal-parking-near-tribeca-high-street-mall-at-nibm-annex/",
    },
    {
      id: "src_03",
      sourceType: "GMaps review",
      handle: "google_reviewer",
      title: "Roadside entrance drainage issue",
      summary:
        "Sewage smell and degraded edge conditions reduce pedestrian comfort and keep people spilling into the roadway.",
      excerpt:
        "Noticeable stench at the roadside entrance continuing to many stores on the road front side. Management should fix that.",
      timestamp: "2026-04-04T15:14:30+05:30",
      confidence: 0.8,
      geoRelevance: "Tribeca roadside entrance",
      url: "https://www.google.com/maps/search/?api=1&query=Tribeca%20Highstreet&query_place_id=ChIJa-SHaOjrwjsRi0SmnPsBGm8",
    },
    {
      id: "src_04",
      sourceType: "Resident forum",
      handle: "Kausarbaug Residents Forum",
      title: "Mass society meeting",
      summary:
        "Multiple societies report that heavy vehicles, restaurant spillover, and unmanaged curb use are compounding each other.",
      excerpt:
        "Haphazard parking, heavy trucks on narrow roads, restaurant-caused traffic jams, broken manholes and unsafe walking conditions.",
      timestamp: "2025-07-21T09:00:00+05:30",
      confidence: 0.9,
      geoRelevance: "Kausarbaug / Parge Nagar",
      url: "https://www.mypunepulse.com/pune-kausarbaug-nibm-road-residents-unite-to-end-pmcs-years-of-civic-neglect/",
    },
    {
      id: "src_05",
      sourceType: "Manual intelligence",
      handle: "Sushaasan field note",
      title: "NIBM junction operating stress",
      summary:
        "Intersection already handles 63,000 vehicles per day, so small curbside disruptions cascade quickly into corridor-wide spillback.",
      excerpt:
        "Peak hours 8am-11am and 5pm-9pm. 13 accidents and 4 fatalities in nearby area between 2022-2024. Public transport capacity remains weak.",
      timestamp: "2025-02-10T00:00:00+05:30",
      confidence: 1.0,
      geoRelevance: "NIBM-Kondhwa Junction",
      url: "manual://nibm-junction-baseline",
    },
    {
      id: "src_06",
      sourceType: "Traffic reading",
      handle: "Google Maps live",
      title: "Corridor slowdown snapshot",
      summary:
        "Live speed snapshots show peak-hour spillback concentrating near the Tribeca / Kausarbaug turn movement.",
      excerpt:
        "Observed speed drops below 12 km/h near the choke stretch during peak spillback windows.",
      timestamp: "2026-04-20T18:05:00+05:30",
      confidence: 0.76,
      geoRelevance: "Tribeca -> Kausarbaug corridor",
      url: "api://google_maps_live/nibm-corridor",
    },
  ],
  hotspots: [
    {
      id: "hot_01",
      label: "Tribeca Gate",
      clusterIds: ["cluster_01", "cluster_04"],
      x: 68,
      y: 34,
      intensity: 0.94,
      blurb: "Parking spillover + pedestrian conflict",
    },
    {
      id: "hot_02",
      label: "Kausarbaug Junction",
      clusterIds: ["cluster_01", "cluster_03", "cluster_05"],
      x: 75,
      y: 50,
      intensity: 0.98,
      blurb: "Choke point where unmanaged curb use becomes corridor-wide jam",
    },
    {
      id: "hot_03",
      label: "Mohamadwadi T-Point",
      clusterIds: ["cluster_02", "cluster_03"],
      x: 57,
      y: 63,
      intensity: 0.82,
      blurb: "Construction vehicle entry + narrow turning conflict",
    },
    {
      id: "hot_04",
      label: "NIBM Junction",
      clusterIds: ["cluster_05"],
      x: 41,
      y: 22,
      intensity: 0.71,
      blurb: "Already overloaded upstream node amplifying downstream disruptions",
    },
  ],
  clusters: [
    {
      id: "cluster_01",
      title: "Illegal curb capture near the commercial edge",
      severity: "critical",
      affectedZone: "Tribeca High Street -> Kausarbaug stretch",
      signalShare: "31%",
      summary:
        "Short-duration curb misuse near Tribeca and Kausarbaug removes a usable lane and triggers manual weaving that quickly turns into stoppage.",
      causes: [
        "No active curb management during peak retail windows",
        "Parking demand spills into the road edge",
        "Vehicles occupy society gates and pavement frontage",
      ],
      authorities: ["Kondhwa Traffic Division", "Ward Office", "Tribeca management"],
      citizenRole: "Residents and shop owners enforce gate discipline and shift to marked loading windows.",
      evidenceIds: ["src_01", "src_02", "src_04"],
    },
    {
      id: "cluster_02",
      title: "Construction logistics spilling into public movement",
      severity: "high",
      affectedZone: "Mohamadwadi approach",
      signalShare: "18%",
      summary:
        "Heavy vehicles and tanker parking convert the approach into a conflict zone before traffic even reaches the commercial bottleneck.",
      causes: [
        "No holding zone for heavy vehicles",
        "Construction and tanker movement overlaps with school and office traffic",
        "Repeated violations produce normalized bad behavior",
      ],
      authorities: ["Traffic Police", "PMC Ward Engineering", "Builder / site logistics"],
      citizenRole: "RWAs log vehicle entry windows and share recurring violators with the ward desk.",
      evidenceIds: ["src_02", "src_04", "src_05"],
    },
    {
      id: "cluster_03",
      title: "Encroachment and informal market spillback",
      severity: "high",
      affectedZone: "Kausarbaug / Parge Nagar edge",
      signalShare: "16%",
      summary:
        "Temporary stalls, festival-period spillover, and unmanaged frontage shrink walking space and push people, carts, and vehicles into the same narrow envelope.",
      causes: [
        "Road-edge vending with no event management protocol",
        "Pedestrian overflow into the carriageway",
        "No temporary circulation plan during high-footfall windows",
      ],
      authorities: ["Ward Office", "Encroachment Dept", "Traffic Police"],
      citizenRole: "Residents and volunteers support temporary lane discipline and event-day circulation rules.",
      evidenceIds: ["src_01", "src_04"],
    },
    {
      id: "cluster_04",
      title: "Pedestrian edge failure",
      severity: "medium",
      affectedZone: "Tribeca roadside entrance",
      signalShare: "11%",
      summary:
        "Drainage, smell, and edge discomfort reduce footpath usability, so pedestrian movements bleed onto the roadway exactly where lane width is already collapsing.",
      causes: [
        "Poor roadside maintenance",
        "No protected pedestrian channel near busy entry points",
        "Storefront edge conditions discourage formal walking paths",
      ],
      authorities: ["PMC Road / Drainage", "Mall operations"],
      citizenRole: "Report blocked footpaths and maintain a shared no-obstruction frontage code.",
      evidenceIds: ["src_02", "src_03"],
    },
    {
      id: "cluster_05",
      title: "Enforcement timing mismatch",
      severity: "critical",
      affectedZone: "Whole NIBM corridor",
      signalShare: "24%",
      summary:
        "The corridor does not fail because there is zero enforcement everywhere. It fails because intervention does not appear at the exact hours and nodes where the cascade starts.",
      causes: [
        "Peak-hour constable coverage is inconsistent",
        "Signal / turning discipline is not tuned to current demand",
        "Recurring chokepoints are treated as isolated incidents instead of a system",
      ],
      authorities: ["Kondhwa Traffic Division", "City traffic engineering"],
      citizenRole: "Volunteer marshals support controlled entry and document repeat breakdown windows.",
      evidenceIds: ["src_01", "src_05", "src_06"],
    },
  ],
  causalLinks: [
    {
      id: "link_01",
      causeNode: "Illegal parking outside commercial frontage",
      effectNode: "Lane narrowing at Tribeca / Kausarbaug edge",
      confidence: 0.94,
      explanation:
        "Vehicles occupying the curb remove a through movement lane and create immediate merge friction.",
    },
    {
      id: "link_02",
      causeNode: "Lane narrowing at Tribeca / Kausarbaug edge",
      effectNode: "Manual weaving and blocked turning pockets",
      confidence: 0.91,
      explanation:
        "Once lane width collapses, right-turn and through movements compete inside the same envelope.",
    },
    {
      id: "link_03",
      causeNode: "Construction / tanker vehicles on Mohamadwadi approach",
      effectNode: "Delayed clearance into the main corridor",
      confidence: 0.84,
      explanation:
        "Approach-side delays reduce downstream recovery and feed extra backlog into the NIBM stretch.",
    },
    {
      id: "link_04",
      causeNode: "Pedestrian spillover from unusable edge conditions",
      effectNode: "More defensive driving and slower throughput",
      confidence: 0.73,
      explanation:
        "When footpaths fail, vehicle speed drops and effective lane capacity drops with it.",
    },
    {
      id: "link_05",
      causeNode: "Enforcement appears after the buildup",
      effectNode: "Peak-hour spillback reaches NIBM junction",
      confidence: 0.89,
      explanation:
        "The cascade becomes corridor-wide because intervention is reactive, not timed to trigger nodes.",
    },
  ],
  executionActors: [
    {
      id: "actor_01",
      name: "Kondhwa Traffic Division",
      governanceLevel: "traffic_police",
      role: "Primary operational owner",
      actionResponsibility: "Peak-hour curb control, tow action, turning discipline, constable deployment",
    },
    {
      id: "actor_02",
      name: "Ward 19 Office",
      governanceLevel: "ward",
      role: "Local civil coordination",
      actionResponsibility: "Vendor regulation, frontage cleanup, resident coordination, volunteer roster",
    },
    {
      id: "actor_03",
      name: "PMC Road / Drainage",
      governanceLevel: "municipal",
      role: "Edge condition repair",
      actionResponsibility: "Drainage fixes, footpath usability, obstruction removal",
    },
    {
      id: "actor_04",
      name: "Tribeca High Street Operations",
      governanceLevel: "citizen",
      role: "Commercial frontage manager",
      actionResponsibility: "Parking marshals, loading windows, entry discipline, event-day lane protection",
    },
    {
      id: "actor_05",
      name: "Kausarbaug Residents Forum",
      governanceLevel: "rwa",
      role: "Citizen coordination layer",
      actionResponsibility: "Volunteer marshals, incident logging, society gate compliance",
    },
    {
      id: "actor_06",
      name: "Builders / tanker operators",
      governanceLevel: "citizen",
      role: "Controlled movement participants",
      actionResponsibility: "Time-window compliance and off-road holding adherence",
    },
    {
      id: "actor_07",
      name: "City Traffic Engineering",
      governanceLevel: "city",
      role: "System optimization owner",
      actionResponsibility: "Signal retiming, turning pocket review, corridor engineering changes",
    },
  ],
  interventions: [
    {
      id: "int_01",
      rank: 1,
      title: "Peak-hour managed curb zone with immediate tow discipline",
      ownerAuthority: "Kondhwa Traffic Division",
      requiredCoordination: ["Ward 19 Office", "Tribeca High Street Operations", "Kausarbaug Residents Forum"],
      citizenRole:
        "Resident volunteers and shop staff help maintain gate clearance and direct vehicles to legal holding.",
      feasibility: "high",
      expectedImpact: "38-45% reduction in corridor spillback during evening peak",
      executionHorizon: "0-14 days",
      procedureAware:
        "Uses existing traffic police authority, no major capex, can start as a controlled enforcement pilot.",
    },
    {
      id: "int_02",
      rank: 2,
      title: "Heavy-vehicle holding zone and timed entry window for Mohamadwadi side",
      ownerAuthority: "Ward 19 Office + Traffic Police",
      requiredCoordination: ["Builders / tanker operators", "PMC Ward Engineering"],
      citizenRole:
        "RWAs submit repeat violator timings and help verify whether the window is being followed.",
      feasibility: "medium",
      expectedImpact: "22-28% reduction in approach-side friction",
      executionHorizon: "7-21 days",
      procedureAware:
        "Requires local enforcement order and site operator compliance, but does not need corridor redesign.",
    },
    {
      id: "int_03",
      rank: 3,
      title: "Festival / high-footfall circulation protocol for Kausarbaug edge",
      ownerAuthority: "Ward Office",
      requiredCoordination: ["Encroachment Dept", "Traffic Police", "Local business operators"],
      citizenRole:
        "Volunteer marshals and resident groups support temporary walking channels and vending boundaries.",
      feasibility: "medium",
      expectedImpact: "Stabilizes footfall-driven shocks before they become jams",
      executionHorizon: "14-30 days",
      procedureAware:
        "Can be issued as a temporary local operating protocol for high-demand windows and seasons.",
    },
    {
      id: "int_04",
      rank: 4,
      title: "Signal / turning movement retiming based on corridor trigger windows",
      ownerAuthority: "City Traffic Engineering",
      requiredCoordination: ["Kondhwa Traffic Division"],
      citizenRole:
        "Citizens continue feeding structured evidence on exact failure windows to refine timing changes.",
      feasibility: "medium",
      expectedImpact: "Improves recovery once curbside triggers are suppressed",
      executionHorizon: "21-45 days",
      procedureAware:
        "Should follow operational pilot results rather than being the first move.",
    },
  ],
  optimizedSolution: {
    title: "NIBM coordinated decongestion strategy",
    primaryStrategy:
      "Treat NIBM as a linked operating system, not a single traffic spot. Remove curb capture first, regulate heavy-vehicle spillover second, stabilize pedestrian and event-period movement third, then tune signals on the cleaned corridor.",
    supportingActions: [
      "Protect the Tribeca / Kausarbaug edge during retail peaks",
      "Move heavy vehicle waiting behavior off the public lane",
      "Create a temporary circulation playbook for high-footfall days",
      "Use timed signal changes only after curbside friction reduces",
    ],
    routingPath: ["citizen", "rwa", "ward", "traffic_police", "municipal", "city"],
    whyBest:
      "This is the highest-feasibility path because it begins with operational interventions already available to local authorities and citizens, while keeping larger municipal and city actions in sequence rather than acting blindly.",
    citizenRole:
      "Citizens are not just signal generators. They become gate-clearance stewards, volunteer marshals, repeat-violation reporters, and compliance partners during pilot windows.",
    expectedOutcome:
      "A visible pilot proving that scattered internet discourse can be converted into an executable, shared civic solution.",
    confidence: 0.88,
  },
  routing: [
    {
      level: "Citizen",
      purpose: "Report friction, document recurring failure windows, protect gate discipline",
      active: true,
    },
    {
      level: "RWA / local forum",
      purpose: "Aggregate society evidence and volunteer support",
      active: true,
    },
    {
      level: "Ward Office",
      purpose: "Coordinate frontage, vending, and local operating protocol",
      active: true,
    },
    {
      level: "Traffic Police",
      purpose: "Own curb control, towing, and turning discipline",
      active: true,
    },
    {
      level: "Municipal",
      purpose: "Repair edge failures and remove physical obstructions",
      active: true,
    },
    {
      level: "City",
      purpose: "Retune systemic movement once local chaos is suppressed",
      active: true,
    },
    {
      level: "State",
      purpose: "Escalate only if corridor behavior reflects a wider policy / mobility issue",
      active: false,
    },
  ],
  citizenRoles: [
    {
      title: "Gate discipline stewards",
      detail: "Societies keep entrances clear and report repeated blocking patterns.",
    },
    {
      title: "Volunteer traffic marshals",
      detail: "Short pilot windows during evening peak help stabilize turning movements until police arrive.",
    },
    {
      title: "Business frontage coordinators",
      detail: "Shops and mall operations maintain loading windows and no-stop frontage zones.",
    },
    {
      title: "Signal truth reporters",
      detail: "Citizens keep feeding real peak-hour breakdown windows so the system learns actual trigger times.",
    },
  ],
  videoScenes: [
    { id: "scene_01", title: "Hook", time: "0-10s", caption: "India doesn't lack opinions. It lacks a system that can turn them into solutions." },
    { id: "scene_02", title: "Scattered internet signals", time: "10-25s", caption: "Reels, reviews, local news, resident forums, traffic APIs, field notes — all saying something, nowhere connecting." },
    { id: "scene_03", title: "NIBM as a digital twin", time: "25-38s", caption: "This is not one traffic complaint. This is a living governance system under stress." },
    { id: "scene_04", title: "Root-cause reveal", time: "38-50s", caption: "Illegal parking, construction spillover, encroachment, pedestrian failure, enforcement timing mismatch." },
    { id: "scene_05", title: "Optimized action output", time: "50-70s", caption: "Sushaasan ranks what to do first, who should own it, and how citizens help execute it." },
    { id: "scene_06", title: "Scale-out", time: "70-82s", caption: "Today NIBM. Tomorrow every ward, city, and state." },
    { id: "scene_07", title: "CTA", time: "82-90s", caption: "Share it. Support it. Help Sushaasan reach the whole nation." },
  ],
};
