import { addPropertyControls } from "framer"
import { useEffect, useState, type CSSProperties } from "react"

interface Props {
    style?: CSSProperties
}

const steps = [
    {
        num: "01",
        title: "Citizens Share What They See",
        desc: "10,000 people in Pune share about water problems - in Hindi, Marathi, English. Voice notes, text, images. Real experiences from real communities.",
        color: "#60a5fa",
        accent: "rgba(30,64,175,0.16)",
        icon: "Input",
    },
    {
        num: "02",
        title: "Every Voice Joins the Picture",
        desc: "Each perspective is understood, geotagged, and connected to others. Your words join thousands of others - building a complete picture no single person could see alone.",
        color: "#a78bfa",
        accent: "rgba(139,92,246,0.16)",
        icon: "Join",
    },
    {
        num: "03",
        title: "AI Weighs Every Factor",
        desc: "Deep neural networks join all perspectives together: root causes, affected areas, feasibility, budget. Not majority rules - an optimized solution where every constraint is considered.",
        color: "#fbbf24",
        accent: "rgba(234,141,10,0.16)",
        icon: "Weigh",
    },
    {
        num: "04",
        title: "Citizens & Government Act Together",
        desc: "A clear, considered solution reaches the right people - with full transparency back to the community. Everyone sees how their voice shaped the outcome.",
        color: "#34d399",
        accent: "rgba(52,211,153,0.16)",
        icon: "Act",
    },
]

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function NeuralExplainer(props: Props) {
    const { style } = props
    const [activeStep, setActiveStep] = useState(0)

    useEffect(() => {
        const interval = window.setInterval(() => {
            setActiveStep((current) => (current + 1) % steps.length)
        }, 2800)

        return () => window.clearInterval(interval)
    }, [])

    const current = steps[activeStep]

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap');

        @keyframes featureGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(96,165,250,0); }
            50% { box-shadow: 0 0 0 18px rgba(96,165,250,0.02); }
        }

        @keyframes markerPulse {
            0%, 100% { transform: scale(1); opacity: 0.72; }
            50% { transform: scale(1.18); opacity: 1; }
        }
    `

    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "100%",
                overflow: "visible",
                background: "#060912",
                padding: "80px 24px",
                color: "#f8fafc",
                ...style,
            }}
        >
            <style>{css}</style>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 18% 20%, rgba(30,64,175,0.16), transparent 25%), radial-gradient(circle at 82% 76%, rgba(234,141,10,0.1), transparent 22%), linear-gradient(180deg, rgba(5,8,16,0.96), rgba(5,8,16,1))",
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "min(1280px, 100%)",
                    height: "100%",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: 28,
                }}
            >
                <div style={{ textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
                    <div
                        style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "rgba(234,141,10,0.78)",
                        }}
                    >
                        The Process
                    </div>
                    <h2
                        style={{
                            margin: "14px 0 0",
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "clamp(38px, 5vw, 66px)",
                            fontWeight: 700,
                            lineHeight: 1.02,
                            letterSpacing: "-0.05em",
                        }}
                    >
                        Voices In.{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg, #dbeafe 0%, #60a5fa 48%, #ea8d0a 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Solutions Out.
                        </span>
                    </h2>
                    <p
                        style={{
                            margin: "18px auto 0",
                            maxWidth: 700,
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 18,
                            lineHeight: 1.8,
                            fontWeight: 300,
                            color: "rgba(203,213,225,0.76)",
                        }}
                    >
                        Not collecting complaints. Not counting votes. Joining every perspective together through AI to build solutions where all factors have been weighed.
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 22,
                        alignItems: "stretch",
                    }}
                >
                    <div
                        style={{
                            flex: "1 1 560px",
                            minWidth: 320,
                            borderRadius: 34,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "linear-gradient(180deg, rgba(9,13,23,0.9), rgba(6,8,15,0.84))",
                            boxShadow: "0 28px 80px rgba(0,0,0,0.32)",
                            padding: "28px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 20,
                            animation: "featureGlow 3.6s ease-in-out infinite",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 16,
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: "rgba(148,163,184,0.76)",
                                        marginBottom: 10,
                                    }}
                                >
                                    Active Stage
                                </div>
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "10px 14px",
                                        borderRadius: 999,
                                        background: current.accent,
                                        border: `1px solid ${current.color}33`,
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 12,
                                        color: "#f8fafc",
                                    }}
                                >
                                    <span
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: current.color,
                                            animation: "markerPulse 1.8s ease-in-out infinite",
                                        }}
                                    />
                                    Step {current.num}
                                </div>
                            </div>

                            <div
                                style={{
                                    padding: "12px 16px",
                                    borderRadius: 20,
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.03)",
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 13,
                                    color: "rgba(203,213,225,0.82)",
                                }}
                            >
                                {current.icon}
                            </div>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gap: 12,
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: "clamp(28px, 3.4vw, 48px)",
                                    fontWeight: 700,
                                    lineHeight: 1.02,
                                    letterSpacing: "-0.04em",
                                }}
                            >
                                {current.title}
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 16,
                                    lineHeight: 1.85,
                                    fontWeight: 300,
                                    color: "rgba(226,232,240,0.82)",
                                    maxWidth: 720,
                                }}
                            >
                                {current.desc}
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                gap: 12,
                            }}
                        >
                            {[
                                "Real communities",
                                "Joined perspectives",
                                "Considered constraints",
                                "Visible outcomes",
                            ].map((item, index) => (
                                <div
                                    key={item}
                                    style={{
                                        padding: "16px 16px 18px",
                                        borderRadius: 18,
                                        background:
                                            index === activeStep
                                                ? current.accent
                                                : "rgba(255,255,255,0.03)",
                                        border:
                                            index === activeStep
                                                ? `1px solid ${current.color}33`
                                                : "1px solid rgba(255,255,255,0.06)",
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 13,
                                        lineHeight: 1.55,
                                        color: "rgba(226,232,240,0.84)",
                                    }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                marginTop: "auto",
                                borderRadius: 24,
                                padding: "18px 20px 20px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.16em",
                                    textTransform: "uppercase",
                                    color: "rgba(148,163,184,0.76)",
                                    marginBottom: 10,
                                }}
                            >
                                The difference
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 15,
                                    lineHeight: 1.8,
                                    color: "rgba(226,232,240,0.8)",
                                }}
                            >
                                On social media, 10,000 opinions create noise. On Sushasan, those same 10,000 perspectives are joined together by AI into one solution - not the most popular answer, but the most considered one, where every factor has been weighed.
                            </p>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: "1 1 340px",
                            minWidth: 300,
                            borderRadius: 34,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "linear-gradient(180deg, rgba(9,13,23,0.84), rgba(6,8,15,0.8))",
                            padding: "24px 22px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 11,
                                fontWeight: 700,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                color: "rgba(148,163,184,0.76)",
                                marginBottom: 2,
                            }}
                        >
                            Every Stage Visible
                        </div>

                        {steps.map((step, index) => (
                            <button
                                key={step.num}
                                type="button"
                                onClick={() => setActiveStep(index)}
                                style={{
                                    textAlign: "left",
                                    borderRadius: 22,
                                    padding: "18px 18px 20px",
                                    border:
                                        index === activeStep
                                            ? `1px solid ${step.color}33`
                                            : "1px solid rgba(255,255,255,0.06)",
                                    background:
                                        index === activeStep
                                            ? step.accent
                                            : "rgba(255,255,255,0.03)",
                                    color: "inherit",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        alignItems: "center",
                                        marginBottom: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: step.color,
                                        }}
                                    >
                                        Step {step.num}
                                    </div>
                                    <div
                                        style={{
                                            width: 9,
                                            height: 9,
                                            borderRadius: "50%",
                                            background: step.color,
                                            opacity: index === activeStep ? 1 : 0.5,
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Poppins', sans-serif",
                                        fontSize: 19,
                                        fontWeight: 600,
                                        lineHeight: 1.25,
                                        letterSpacing: "-0.02em",
                                        marginBottom: 8,
                                    }}
                                >
                                    {step.title}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: 14,
                                        lineHeight: 1.7,
                                        color: "rgba(203,213,225,0.76)",
                                    }}
                                >
                                    {step.desc}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(NeuralExplainer, {})
