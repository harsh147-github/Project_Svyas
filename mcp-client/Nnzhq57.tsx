import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface Props {
    style?: CSSProperties
}

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

function easeOutQuart(t: number) {
    return 1 - Math.pow(1 - t, 4)
}

function useCountUp(target: number, durationMs: number, inView: boolean, isStatic: boolean) {
    const [value, setValue] = useState(isStatic ? target : 0)
    useEffect(() => {
        if (isStatic || !inView) return
        const start = performance.now()
        let raf = 0
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs)
            const eased = easeOutQuart(t)
            setValue(Math.round(eased * target))
            if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [inView, isStatic, target, durationMs])
    return value
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ActScale(props: Props) {
    const { style } = props
    const isStatic = useIsStaticRenderer()
    const { ref, inView } = useInView(0.05)

    const bigNum = useCountUp(500_000_000, 2600, inView, isStatic)
    const stat1 = useCountUp(3, 1400, inView, isStatic)
    const stat3 = useCountUp(0, 800, inView, isStatic)
    const stat2Visible = inView || isStatic

    const headlineWords = ["Every", "one", "has", "something", "to", "say."]

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Poppins:wght@500;600;700&display=swap');

        @keyframes scaleRise {
            from { opacity: 0; transform: translateY(32px); filter: blur(6px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes wordRise {
            from { opacity: 0; transform: translateY(55%) rotateX(-18deg); }
            to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.9; }
        }

        @keyframes rulePulse {
            0% { transform: scaleX(0); opacity: 0; }
            100% { transform: scaleX(1); opacity: 1; }
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
                    "radial-gradient(ellipse at 50% 20%, rgba(234,141,10,0.08) 0%, transparent 55%), radial-gradient(ellipse at 50% 85%, rgba(30,64,175,0.08) 0%, transparent 60%), #050810",
                color: "#f8fafc",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "clamp(64px, 10vh, 120px) 24px",
                ...style,
            }}
        >
            <style>{css}</style>

            {/* subtle grid */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 30%, transparent 75%)",
                    pointerEvents: "none",
                }}
            />

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "min(1200px, 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    gap: 28,
                }}
            >
                {/* Eyebrow */}
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
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "scaleRise 700ms cubic-bezier(0.16,1,0.3,1) both"
                            : "none",
                    }}
                >
                    <span
                        style={{
                            width: 24,
                            height: 1,
                            background:
                                "linear-gradient(90deg, transparent, rgba(234,141,10,0.9))",
                        }}
                    />
                    The Scale
                    <span
                        style={{
                            width: 24,
                            height: 1,
                            background:
                                "linear-gradient(90deg, rgba(234,141,10,0.9), transparent)",
                        }}
                    />
                </div>

                {/* Big Number — single line, tabular-nums, responsive */}
                <div
                    style={{
                        width: "100%",
                        overflow: "hidden",
                        padding: "0 8px",
                    }}
                >
                    <div
                        style={{
                            margin: 0,
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: "clamp(56px, 11vw, 180px)",
                            fontWeight: 700,
                            lineHeight: 0.95,
                            letterSpacing: "-0.045em",
                            color: "#fbbf24",
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums",
                            textShadow:
                                "0 0 50px rgba(234,141,10,0.45), 0 18px 60px rgba(0,0,0,0.4)",
                            opacity: inView ? 1 : 0,
                            transition: "opacity 600ms ease 120ms",
                        }}
                    >
                        {bigNum.toLocaleString("en-US")}
                    </div>
                </div>

                {/* Caption */}
                <div
                    style={{
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "clamp(15px, 1.4vw, 20px)",
                        color: "rgba(226,232,240,0.78)",
                        letterSpacing: "0.02em",
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "scaleRise 700ms cubic-bezier(0.16,1,0.3,1) 300ms both"
                            : "none",
                    }}
                >
                    people with something to say.
                </div>

                {/* Tricolor rule */}
                <div
                    style={{
                        width: "min(360px, 60%)",
                        height: 1.5,
                        transformOrigin: "center",
                        animation: inView
                            ? "rulePulse 1200ms cubic-bezier(0.16,1,0.3,1) 500ms both"
                            : "none",
                        display: "flex",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            background:
                                "linear-gradient(90deg, transparent, rgba(234,141,10,0.9))",
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            background:
                                "linear-gradient(90deg, rgba(234,141,10,0.9), rgba(255,255,255,0.7), rgba(19,136,8,0.9))",
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            background:
                                "linear-gradient(90deg, rgba(19,136,8,0.9), transparent)",
                        }}
                    />
                </div>

                {/* Headline — word by word */}
                <h2
                    style={{
                        margin: 0,
                        fontFamily: "'Fraunces', serif",
                        fontWeight: 400,
                        fontSize: "clamp(32px, 5.5vw, 72px)",
                        lineHeight: 1.08,
                        letterSpacing: "-0.02em",
                        color: "#f8fafc",
                        maxWidth: 880,
                        perspective: 1000,
                    }}
                >
                    {headlineWords.map((word, i) => (
                        <span
                            key={`${word}-${i}`}
                            style={{
                                display: "inline-block",
                                marginRight: "0.25em",
                                opacity: inView ? 1 : 0,
                                animation: inView
                                    ? `wordRise 760ms cubic-bezier(0.16,1,0.3,1) ${420 + i * 50}ms both`
                                    : "none",
                            }}
                        >
                            {word}
                        </span>
                    ))}
                </h2>

                {/* Italic dim line */}
                <div
                    style={{
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "clamp(18px, 2vw, 26px)",
                        color: "rgba(226,232,240,0.8)",
                        maxWidth: 720,
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "scaleRise 800ms cubic-bezier(0.16,1,0.3,1) 900ms both"
                            : "none",
                    }}
                >
                    Almost none are heard.
                </div>

                {/* Stats row */}
                <div
                    style={{
                        marginTop: 24,
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 20,
                        width: "min(820px, 100%)",
                        opacity: inView ? 1 : 0,
                        animation: inView
                            ? "scaleRise 800ms cubic-bezier(0.16,1,0.3,1) 1140ms both"
                            : "none",
                    }}
                >
                    {[
                        { display: `${stat1}%`, label: "Respond to surveys" },
                        {
                            display: stat2Visible ? "<1%" : "0%",
                            label: "Attend consultations",
                        },
                        { display: `${stat3}`, label: "Loops actually close" },
                    ].map((s, i) => (
                        <div
                            key={s.label}
                            style={{
                                position: "relative",
                                padding: "22px 18px",
                                borderRadius: 18,
                                border: "1px solid rgba(58,134,255,0.3)",
                                background:
                                    "linear-gradient(180deg, rgba(11,16,28,0.82), rgba(7,10,18,0.6))",
                                backdropFilter: "blur(16px)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 2,
                                    background:
                                        "linear-gradient(90deg, transparent, #60a5fa, transparent)",
                                    opacity: 0.65,
                                }}
                            />
                            <div
                                style={{
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: "clamp(30px, 3.4vw, 44px)",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    letterSpacing: "-0.04em",
                                    color: "#60a5fa",
                                    fontVariantNumeric: "tabular-nums",
                                }}
                            >
                                {s.display}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    textTransform: "uppercase",
                                    color: "rgba(226,232,240,0.86)",
                                }}
                            >
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

addPropertyControls(ActScale, {})
