import { addPropertyControls, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface Props {
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ActEmergence(props: Props) {
    const { style } = props
    const isStatic = useIsStaticRenderer()
    const sectionRef = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(isStatic)

    useEffect(() => {
        if (isStatic) return
        const el = sectionRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.18 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Poppins:wght@500;600;700&display=swap');

        @keyframes emergeRise {
            from { opacity: 0; transform: translateY(28px); filter: blur(6px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes emergePulse {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 1; }
        }
    `

    const transition = "all 800ms cubic-bezier(0.16, 1, 0.3, 1)"

    return (
        <section
            ref={sectionRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: "100%",
                overflow: "hidden",
                background:
                    "radial-gradient(circle at 50% 34%, rgba(234,141,10,0.14) 0%, rgba(234,141,10,0.06) 18%, transparent 40%), linear-gradient(180deg, #08111c 0%, #060a14 100%)",
                color: "#f8fafc",
                ...style,
            }}
        >
            <style>{css}</style>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                    backgroundSize: "72px 72px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 20%, transparent 72%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 1440,
                        height: 1440,
                        marginLeft: -720,
                        marginTop: -720,
                        borderRadius: "50%",
                        border: "1px solid rgba(234,141,10,0.22)",
                        opacity: visible ? 1 : 0.3,
                        transition,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 1040,
                        height: 1040,
                        marginLeft: -520,
                        marginTop: -520,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.14)",
                        opacity: visible ? 1 : 0.25,
                        transition,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 660,
                        height: 660,
                        marginLeft: -330,
                        marginTop: -330,
                        borderRadius: "50%",
                        border: "1px solid rgba(19,136,8,0.22)",
                        opacity: visible ? 1 : 0.2,
                        transition,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: 280,
                        height: 280,
                        marginLeft: -140,
                        marginTop: -140,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(251,191,36,0.48) 0%, rgba(234,141,10,0.18) 42%, transparent 72%)",
                        filter: "blur(2px)",
                        opacity: visible ? 1 : 0.35,
                        animation: visible ? "emergePulse 3.6s ease-in-out infinite" : "none",
                    }}
                />
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "min(1120px, 100%)",
                    height: "100%",
                    margin: "0 auto",
                    padding: "88px 24px 72px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 26,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.32em",
                        textTransform: "uppercase",
                        color: "#fbbf24",
                        opacity: visible ? 1 : 0,
                        animation: visible
                            ? "emergeRise 700ms cubic-bezier(0.16, 1, 0.3, 1) both"
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
                    The Emergence
                    <span
                        style={{
                            width: 20,
                            height: 1,
                            background:
                                "linear-gradient(90deg, rgba(234,141,10,0.9), transparent)",
                        }}
                    />
                </div>

                <h2
                    style={{
                        margin: 0,
                        maxWidth: 980,
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 400,
                        fontSize: "clamp(42px, 5.9vw, 84px)",
                        lineHeight: 1.06,
                        letterSpacing: "-0.03em",
                        color: "#f8fafc",
                        textShadow: "0 8px 40px rgba(0,0,0,0.45)",
                        opacity: visible ? 1 : 0,
                        animation: visible
                            ? "emergeRise 820ms cubic-bezier(0.16, 1, 0.3, 1) 120ms both"
                            : "none",
                    }}
                >
                    What if the picture could be drawn by everyone at once?
                </h2>

                <div
                    style={{
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "clamp(18px, 1.8vw, 24px)",
                        color: "rgba(226,232,240,0.8)",
                        opacity: visible ? 1 : 0,
                        animation: visible
                            ? "emergeRise 760ms cubic-bezier(0.16, 1, 0.3, 1) 240ms both"
                            : "none",
                    }}
                >
                    Not a survey. Not a petition. Not another feed.
                </div>

                <div
                    style={{
                        width: "min(680px, 76%)",
                        height: 1,
                        background:
                            "linear-gradient(90deg, transparent, rgba(234,141,10,0.65), rgba(255,255,255,0.18), rgba(19,136,8,0.55), transparent)",
                        opacity: visible ? 1 : 0,
                        animation: visible
                            ? "emergeRise 760ms cubic-bezier(0.16, 1, 0.3, 1) 320ms both"
                            : "none",
                    }}
                />

                <div
                    style={{
                        marginTop: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(28px, 3.4vw, 48px)",
                        lineHeight: 1.12,
                        letterSpacing: "-0.03em",
                    }}
                >
                    <div
                        style={{
                            color: "#fbbf24",
                            textShadow: "0 0 30px rgba(234,141,10,0.35)",
                            opacity: visible ? 1 : 0,
                            animation: visible
                                ? "emergeRise 780ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both"
                                : "none",
                        }}
                    >
                        A shared map.
                    </div>
                    <div
                        style={{
                            color: "#f8fafc",
                            opacity: visible ? 1 : 0,
                            animation: visible
                                ? "emergeRise 780ms cubic-bezier(0.16, 1, 0.3, 1) 500ms both"
                                : "none",
                        }}
                    >
                        One picture.
                    </div>
                    <div
                        style={{
                            color: "#34c759",
                            textShadow: "0 0 30px rgba(19,136,8,0.35)",
                            opacity: visible ? 1 : 0,
                            animation: visible
                                ? "emergeRise 780ms cubic-bezier(0.16, 1, 0.3, 1) 600ms both"
                                : "none",
                        }}
                    >
                        Built together.
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(ActEmergence, {})
