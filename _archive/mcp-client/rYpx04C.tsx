import { addPropertyControls } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface Props {
    style?: CSSProperties
}

const issues = [
    {
        title: "Water Supply Disruption - Ward 12, Pune",
        voices: "12,847",
        consensus: "94.2%",
        status: "Solution Ready",
        statusColor: "#34d399",
        priority: "Critical",
        priorityColor: "#ef4444",
        solution: "Pipeline rehabilitation, Sector 7 main line. Phased over 6 months.",
        cost: "Rs 4.2 Cr",
        departments: ["Municipal Water Board", "PWD"],
    },
    {
        title: "Traffic Congestion - Hinjewadi IT Corridor",
        voices: "28,340",
        consensus: "87.6%",
        status: "Under Discussion",
        statusColor: "#fbbf24",
        priority: "High",
        priorityColor: "#f97316",
        solution: "4-department coordinated plan: road widening, bus rapid transit, and parking zones.",
        cost: "Rs 18.5 Cr",
        departments: ["PWD", "PMPML", "MIDC", "PMC"],
    },
    {
        title: "School Sanitation - Jayanagar, Bengaluru",
        voices: "5,230",
        consensus: "91.8%",
        status: "Awaiting Execution",
        statusColor: "#60a5fa",
        priority: "High",
        priorityColor: "#f97316",
        solution: "Repair 47 school toilet blocks and establish a community maintenance program.",
        cost: "Rs 85 L",
        departments: ["BBMP Education", "Public Health"],
    },
    {
        title: "Power Outages - Sector 15, Noida",
        voices: "9,100",
        consensus: "89.4%",
        status: "In Progress",
        statusColor: "#a78bfa",
        priority: "Critical",
        priorityColor: "#ef4444",
        solution: "Transformer upgrade and grid load balancing for the residential zone.",
        cost: "Rs 2.8 Cr",
        departments: ["PVVNL", "NEDA"],
    },
    {
        title: "Public Transit Gaps - T. Nagar, Chennai",
        voices: "15,620",
        consensus: "86.1%",
        status: "Solution Ready",
        statusColor: "#34d399",
        priority: "Medium",
        priorityColor: "#fbbf24",
        solution: "Three new mini-bus routes connecting metro stations to residential areas.",
        cost: "Rs 1.2 Cr/yr",
        departments: ["MTC", "CMDA"],
    },
]

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function TransparentDashboard(props: Props) {
    const { style } = props
    const [activeIssue, setActiveIssue] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = ref.current
        if (!element) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true)
            },
            { threshold: 0.18 },
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveIssue((current) => (current + 1) % issues.length)
        }, 3400)

        return () => window.clearInterval(interval)
    }, [])

    const active = issues[activeIssue]

    return (
        <section
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#060912",
                padding: "88px 24px",
                color: "#f8fafc",
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 18% 20%, rgba(30,64,175,0.16), transparent 25%), radial-gradient(circle at 82% 74%, rgba(234,141,10,0.1), transparent 22%), linear-gradient(180deg, rgba(5,8,16,0.96), rgba(5,8,16,1))",
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "min(1320px, 100%)",
                    height: "100%",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: 28,
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: "all 900ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                <div style={{ textAlign: "center", maxWidth: 860, margin: "0 auto" }}>
                    <div
                        style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "rgba(234,141,10,0.78)",
                        }}
                    >
                        Full Transparency
                    </div>
                    <h2
                        style={{
                            margin: "14px 0 0",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "clamp(38px, 5vw, 66px)",
                            fontWeight: 700,
                            lineHeight: 1.02,
                            letterSpacing: "-0.05em",
                        }}
                    >
                        A Dashboard for the <span style={{ background: "linear-gradient(135deg, #dbeafe 0%, #60a5fa 48%, #ea8d0a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Entire Nation</span>
                    </h2>
                    <p
                        style={{
                            margin: "18px auto 0",
                            maxWidth: 760,
                            fontFamily: "Inter, sans-serif",
                            fontSize: 18,
                            lineHeight: 1.8,
                            fontWeight: 300,
                            color: "rgba(203,213,225,0.76)",
                        }}
                    >
                        Every optimized solution, visible to everyone - citizens, officials, media. Complete transparency on what is being discussed, what has been solved, and what awaits execution.
                    </p>
                </div>

                <div
                    style={{
                        borderRadius: 36,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "linear-gradient(180deg, rgba(9,13,23,0.9), rgba(6,8,15,0.84))",
                        boxShadow: "0 32px 80px rgba(0,0,0,0.34)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                            alignItems: "center",
                            padding: "16px 22px",
                            background: "rgba(255,255,255,0.03)",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ display: "flex", gap: 6 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }} />
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399" }} />
                            </div>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(148,163,184,0.82)" }}>sushaasan.in/dashboard</span>
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "Inter, sans-serif", fontSize: 12, color: "#34d399" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399" }} />
                            Visible to all
                        </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", minHeight: 520 }}>
                        <div
                            style={{
                                flex: "1 1 270px",
                                minWidth: 260,
                                padding: "24px 18px",
                                borderRight: "1px solid rgba(255,255,255,0.06)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.76)", marginBottom: 4 }}>Top National Issues</div>
                            {issues.map((issue, index) => (
                                <button
                                    key={issue.title}
                                    type="button"
                                    onClick={() => setActiveIssue(index)}
                                    style={{
                                        textAlign: "left",
                                        borderRadius: 18,
                                        padding: "14px 14px 16px",
                                        border: index === activeIssue ? "1px solid rgba(96,165,250,0.26)" : "1px solid rgba(255,255,255,0.06)",
                                        background: index === activeIssue ? "linear-gradient(180deg, rgba(30,64,175,0.14), rgba(8,12,20,0.96))" : "rgba(255,255,255,0.02)",
                                        color: "inherit",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 16, lineHeight: 1.32, letterSpacing: "-0.02em", marginBottom: 8 }}>{issue.title}</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        <span style={{ padding: "4px 8px", borderRadius: 999, background: `${issue.statusColor}18`, color: issue.statusColor, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 600 }}>{issue.status}</span>
                                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(148,163,184,0.78)" }}>{issue.voices} voices</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div
                            style={{
                                flex: "1 1 470px",
                                minWidth: 340,
                                padding: "26px 22px",
                                borderRight: "1px solid rgba(255,255,255,0.06)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 18,
                            }}
                        >
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                <span style={{ padding: "5px 10px", borderRadius: 999, background: `${active.priorityColor}18`, color: active.priorityColor, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{active.priority}</span>
                                <span style={{ padding: "5px 10px", borderRadius: 999, background: `${active.statusColor}18`, color: active.statusColor, fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{active.status}</span>
                            </div>

                            <div>
                                <h3 style={{ margin: 0, fontFamily: "Poppins, sans-serif", fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.04em" }}>{active.title}</h3>
                                <p style={{ margin: "14px 0 0", fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: 1.8, color: "rgba(203,213,225,0.78)" }}>No more sifting through scattered complaints. A clear, ranked, visible response for everyone involved.</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                                {[
                                    { label: "Voices Joined", value: active.voices, color: "#60a5fa" },
                                    { label: "Consensus", value: active.consensus, color: "#34d399" },
                                    { label: "Est. Cost", value: active.cost, color: "#fbbf24" },
                                ].map((stat) => (
                                    <div key={stat.label} style={{ borderRadius: 18, padding: "16px 16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(148,163,184,0.76)", marginBottom: 8 }}>{stat.label}</div>
                                        <div style={{ fontFamily: "Poppins, sans-serif", fontSize: 28, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", color: stat.color }}>{stat.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderRadius: 22, padding: "20px 20px 22px", background: "linear-gradient(180deg, rgba(234,141,10,0.1), rgba(255,255,255,0.02))", border: "1px solid rgba(234,141,10,0.14)" }}>
                                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(234,141,10,0.84)", marginBottom: 10 }}>Optimized Solution</div>
                                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, lineHeight: 1.75, color: "rgba(248,250,252,0.86)" }}>{active.solution}</div>
                            </div>
                        </div>

                        <div style={{ flex: "1 1 280px", minWidth: 260, padding: "26px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ borderRadius: 20, padding: "18px 18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.76)", marginBottom: 10 }}>Departments Involved</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {active.departments.map((department) => (
                                        <span key={department} style={{ padding: "8px 10px", borderRadius: 14, background: "rgba(30,64,175,0.12)", border: "1px solid rgba(30,64,175,0.18)", fontFamily: "Inter, sans-serif", fontSize: 12, color: "#bfdbfe" }}>{department}</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ borderRadius: 20, padding: "18px 18px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(148,163,184,0.76)", marginBottom: 12 }}>Public Ledger</div>
                                {[
                                    "Received and joined into the national issue graph",
                                    "Consensus and urgency calculated across inputs",
                                    "Visible to citizens, institutions, and media",
                                ].map((item) => (
                                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                                        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#34d399", marginTop: 6, flexShrink: 0 }} />
                                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.7, color: "rgba(226,232,240,0.8)" }}>{item}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderRadius: 20, padding: "18px 18px 20px", background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}>
                                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.75, color: "rgba(226,232,240,0.82)" }}>Every issue, every solution, every status update. Visible to the entire nation instead of locked behind bureaucratic walls.</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: "18px 22px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: 1.8, color: "rgba(203,213,225,0.8)" }}>
                        Every issue. Every solution. Every status update. Visible to the entire nation - not hidden behind bureaucratic walls, but open for everyone to see, track, and hold accountable.
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(TransparentDashboard, {})