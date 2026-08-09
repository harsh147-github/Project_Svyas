import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface Props {
    style?: CSSProperties
}

const rows = [
    {
        num: "01",
        label: "Surveys",
        body: "A question is asked. An answer is filed. No one ever comes back.",
        tag: "forgotten",
    },
    {
        num: "02",
        label: "Petitions",
        body: "Ten thousand signatures collapse into one unread PDF on a desk.",
        tag: "ignored",
    },
    {
        num: "03",
        label: "Social media",
        body: "Trending on Tuesday. Forgotten by Friday. Nothing actually changes.",
        tag: "noise",
    },
]

function useInView(threshold = 0.05) {
    const ref = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    obs.disconnect()
                }
            },
            { threshold }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [threshold])
    return { ref, inView }
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ActBrokenLoop(props: Props) {
    const { style } = props
    const isStatic = useIsStaticRenderer()
    const { ref, inView } = useInView(0.05)

    const titleWords = [
        "Every",
        "tool",
        "was",
        "supposed",
        "to",
        "close",
        "the",
        "gap.",
    ]

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Poppins:wght@500;600;700&display=swap');

        @keyframes brokenRise {
            from { opacity: 0; transform: translateY(28px); filter: blur(5px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes wordRise {
            from { opacity: 0; transform: translateY(55%) rotateX(-18deg); }
            to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        @keyframes rowSlide {
            from { opacity: 0; transform: translateX(-36px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes strikeThrough {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
        }

        @keyframes ruleExpand {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
        }
    `

    return (
        <section
            ref={ref}
            style={{
                position: "relative",
                width: "100%",
                minHeight: "100vh",
                background:
                    "radial-gradient(ellipse at 50% 30%, rgba(30,64,175,0.1) 0%, transparent 60%), linear-gradient(180deg, #060a14, #070c18)",
                color: "#f8fafc",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(80px, 12vh, 140px) 24px",
                ...style,
            }}
        >
            <style>{css}</style>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 35%, transparent 78%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "min(1100px, 100%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 40,
                }}
            >
                {/* Eyebrow */}
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        alignSelf: "center",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: "#fbbf24",
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "brokenRise 700ms cubic-bezier(0.16,1,0.3,1) both"
                            : "none",
                    }}
                >
                    <span
                        style={{
                            width: 20,
                            height: 1,
                            background:
                                "linear-gradient(90deg, transparent, rgba(234,141,10,0.9))",
                        }}
                    />
                    The Broken Loop
                    <span
                        style={{
                            width: 20,
                            height: 1,
                            background:
                                "linear-gradient(90deg, rgba(234,141,10,0.9), transparent)",
                        }}
                    />
                </div>

                {/* Title — word reveal */}
                <h2
                    style={{
                        margin: 0,
                        textAlign: "center",
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 400,
                        fontSize: "clamp(34px, 5.6vw, 76px)",
                        lineHeight: 1.08,
                        letterSpacing: "-0.02em",
                        color: "#f8fafc",
                        perspective: 1000,
                    }}
                >
                    {titleWords.map((word, i) => (
                        <span
                            key={`${word}-${i}`}
                            style={{
                                display: "inline-block",
                                marginRight: "0.25em",
                                opacity: inView ? 1 : 0,
                                animation: inView
                                    ? `wordRise 720ms cubic-bezier(0.16,1,0.3,1) ${150 + i * 50}ms both`
                                    : "none",
                            }}
                        >
                            {word}
                        </span>
                    ))}
                </h2>

                {/* Italic subtitle — upgraded contrast */}
                <div
                    style={{
                        textAlign: "center",
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "clamp(18px, 2vw, 24px)",
                        lineHeight: 1.4,
                        color: "rgba(226,232,240,0.82)",
                        letterSpacing: "0.01em",
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "brokenRise 780ms cubic-bezier(0.16,1,0.3,1) 660ms both"
                            : "none",
                    }}
                >
                    Instead, each one became another way to avoid listening.
                </div>

                {/* Divider */}
                <div
                    style={{
                        width: "100%",
                        height: 1,
                        background:
                            "linear-gradient(90deg, transparent, rgba(234,141,10,0.4) 20%, rgba(255,255,255,0.2) 50%, rgba(19,136,8,0.4) 80%, transparent)",
                        transformOrigin: "center",
                        animation: inView
                            ? "ruleExpand 1200ms cubic-bezier(0.16,1,0.3,1) 840ms both"
                            : "none",
                    }}
                />

                {/* Rows */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0,
                    }}
                >
                    {rows.map((row, i) => (
                        <div
                            key={row.num}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "80px 180px 1fr auto",
                                alignItems: "start",
                                gap: 24,
                                padding: "28px 8px",
                                borderBottom:
                                    "1px solid rgba(255,255,255,0.08)",
                                opacity: inView ? 1 : 0,
                                animation: inView
                                    ? `rowSlide 720ms cubic-bezier(0.16,1,0.3,1) ${1020 + i * 130}ms both`
                                    : "none",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "'Fraunces', serif",
                                    fontStyle: "italic",
                                    fontWeight: 300,
                                    fontSize: "clamp(28px, 3vw, 42px)",
                                    color: "rgba(251,191,36,0.85)",
                                    lineHeight: 1,
                                    letterSpacing: "-0.02em",
                                }}
                            >
                                {row.num}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontWeight: 600,
                                    fontSize: "clamp(20px, 2vw, 28px)",
                                    color: "#f8fafc",
                                    lineHeight: 1.1,
                                    letterSpacing: "-0.015em",
                                }}
                            >
                                {row.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: "clamp(15px, 1.4vw, 18px)",
                                    fontWeight: 300,
                                    lineHeight: 1.65,
                                    color: "rgba(226,232,240,0.82)",
                                }}
                            >
                                {row.body}
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "5px 11px",
                                    borderRadius: 999,
                                    border: "1px solid rgba(239,68,68,0.35)",
                                    background: "rgba(239,68,68,0.08)",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: "rgba(252,165,165,0.95)",
                                    whiteSpace: "nowrap",
                                    alignSelf: "center",
                                }}
                            >
                                {row.tag}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Outro punchline */}
                <div
                    style={{
                        marginTop: 24,
                        textAlign: "center",
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 400,
                        fontSize: "clamp(20px, 2.4vw, 30px)",
                        lineHeight: 1.3,
                        color: "rgba(226,232,240,0.95)",
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "brokenRise 800ms cubic-bezier(0.16,1,0.3,1) 1500ms both"
                            : "none",
                    }}
                >
                    Three decades of tools.{" "}
                    <span
                        style={{
                            color: "rgba(148,163,184,0.7)",
                            fontStyle: "italic",
                        }}
                    >
                        Zero
                    </span>{" "}
                    real loops closed.
                </div>
            </div>
        </section>
    )
}

addPropertyControls(ActBrokenLoop, {})
