import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect, useRef, useState, type CSSProperties } from "react"

interface Props {
    videoUrl: string
    overlayOpacity: number
    style?: CSSProperties
}

const stats = [
    { value: "500M+", label: "Voices, listened to", tone: "saffron" },
    { value: "22", label: "Languages, understood", tone: "navy" },
    { value: "<5s", label: "Scatter to signal", tone: "green" },
]

const toneColors: Record<
    string,
    { glow: string; chip: string; num: string; border: string }
> = {
    saffron: {
        glow: "rgba(234,141,10,0.14)",
        chip: "rgba(251,191,36,0.2)",
        num: "#fbbf24",
        border: "rgba(234,141,10,0.35)",
    },
    navy: {
        glow: "rgba(30,64,175,0.18)",
        chip: "rgba(96,165,250,0.2)",
        num: "#60a5fa",
        border: "rgba(58,134,255,0.35)",
    },
    green: {
        glow: "rgba(19,136,8,0.18)",
        chip: "rgba(52,199,89,0.2)",
        num: "#34c759",
        border: "rgba(52,199,89,0.4)",
    },
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function PremiumHero(props: Props) {
    const {
        videoUrl = "https://files.catbox.moe/pguib9.mp4",
        overlayOpacity = 0.58,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const videoRef = useRef<HTMLVideoElement>(null)
    const [loaded, setLoaded] = useState(false)
    const [scrollY, setScrollY] = useState(0)
    const [pointer, setPointer] = useState({ x: 68, y: 32 })

    useEffect(() => {
        if (videoRef.current && !isStatic) {
            videoRef.current.play().catch(() => {})
        }
        const timer = window.setTimeout(() => setLoaded(true), 120)
        return () => window.clearTimeout(timer)
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        const handleScroll = () => setScrollY(window.scrollY)
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [isStatic])

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

        @keyframes heroRise {
            from { opacity: 0; transform: translateY(34px); filter: blur(8px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        @keyframes wordRise {
            from { opacity: 0; transform: translateY(40%) rotateX(-20deg); }
            to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        @keyframes grainShift {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(-5%, 3%); }
            40% { transform: translate(4%, -4%); }
            60% { transform: translate(-3%, 5%); }
            80% { transform: translate(5%, -2%); }
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 0.95; }
        }

        @keyframes signalSweep {
            0% { transform: translateX(-120%); opacity: 0; }
            40% { opacity: 1; }
            100% { transform: translateX(120%); opacity: 0; }
        }

        @keyframes caretBlink {
            0%, 45% { opacity: 1; }
            55%, 100% { opacity: 0; }
        }
    `

    const parallax = isStatic ? 0 : scrollY * 0.2
    const contentDrift = isStatic ? 0 : scrollY * 0.09
    const headlineScale = isStatic ? 1 : Math.max(0.88, 1 - scrollY * 0.00035)

    // Word-rise choreography for the subtitle
    const subtitleWords = [
        "India",
        "speaks",
        "every",
        "day.",
        "Sushaasan",
        "turns",
        "that",
        "scatter",
        "into",
        "signal",
        "governance",
        "can",
        "act",
        "on.",
    ]

    return (
        <section
            onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                setPointer({
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                })
            }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#050810",
                color: "#f8fafc",
                ...style,
            }}
        >
            <style>{css}</style>

            {!isStatic ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={videoUrl}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        minWidth: "110%",
                        minHeight: "110%",
                        width: "auto",
                        height: "auto",
                        objectFit: "cover",
                        transform: `translate(-50%, calc(-50% + ${parallax}px)) scale(${1.08 + scrollY * 0.00015})`,
                        transition: "transform 100ms linear",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(circle at 20% 20%, rgba(30,64,175,0.22), transparent 32%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 35%), radial-gradient(circle at 80% 82%, rgba(19,136,8,0.2), transparent 32%), radial-gradient(circle at 15% 85%, rgba(234,141,10,0.16), transparent 30%), linear-gradient(145deg, #070b14 0%, #09111f 48%, #050810 100%)",
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, rgba(4,7,14,${overlayOpacity * 0.34}) 0%, rgba(4,7,14,${overlayOpacity * 0.58}) 30%, rgba(4,7,14,${overlayOpacity * 0.96}) 100%)`,
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at ${pointer.x}% ${pointer.y}%, rgba(255,255,255,0.09), transparent 26%), radial-gradient(circle at 82% 16%, rgba(30,64,175,0.2), transparent 26%), radial-gradient(circle at 18% 84%, rgba(19,136,8,0.16), transparent 24%), radial-gradient(circle at 86% 86%, rgba(234,141,10,0.14), transparent 22%)`,
                    transition: "background 240ms ease-out",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: "-40%",
                    background:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.55'/%3E%3C/svg%3E\")",
                    opacity: 0.055,
                    mixBlendMode: "soft-light",
                    animation: "grainShift 10s steps(10) infinite",
                    pointerEvents: "none",
                }}
            />

            {/* Tricolor top accent line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                        "linear-gradient(90deg, transparent 0%, rgba(234,141,10,0) 5%, rgba(234,141,10,0.9) 22%, rgba(234,141,10,0.9) 38%, rgba(255,255,255,0.95) 50%, rgba(19,136,8,0.9) 62%, rgba(19,136,8,0.9) 78%, rgba(19,136,8,0) 95%, transparent 100%)",
                    boxShadow:
                        "0 0 22px rgba(234,141,10,0.4), 0 0 34px rgba(19,136,8,0.28)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0.9) 60%, transparent 100%)",
                        width: "20%",
                        animation: "signalSweep 6.5s ease-in-out infinite 2s",
                    }}
                />
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    width: "min(1360px, calc(100% - 48px))",
                    height: "100%",
                    margin: "0 auto",
                    padding: "120px 0 32px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 28,
                }}
            >
                {/* Top chips */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        opacity: loaded ? 1 : 0,
                        transform: loaded ? "translateY(0)" : "translateY(18px)",
                        transition: "all 800ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "11px 16px",
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(8,12,20,0.58)",
                            backdropFilter: "blur(16px)",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "rgba(240,240,240,0.86)",
                        }}
                    >
                        <span
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background:
                                    "linear-gradient(135deg, #ea8d0a 0%, #ffffff 50%, #138808 100%)",
                                boxShadow:
                                    "0 0 20px rgba(234,141,10,0.75), 0 0 32px rgba(19,136,8,0.45)",
                                animation: "glowPulse 2.2s ease-in-out infinite",
                            }}
                        />
                        The signal layer for Indian governance
                    </div>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 16px",
                            borderRadius: 999,
                            background: "rgba(5,8,16,0.54)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            fontFamily: "'Fraunces', serif",
                            fontStyle: "italic",
                            fontSize: 13,
                            fontWeight: 400,
                            color: "rgba(226,232,240,0.9)",
                        }}
                    >
                        <span
                            style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: "#fbbf24",
                                boxShadow: "0 0 10px rgba(251,191,36,0.8)",
                            }}
                        />
                        The digital twin of next-generation Indian governance
                    </div>
                </div>

                {/* Main hero content */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 32,
                        alignItems: "flex-end",
                        transform: `translateY(${contentDrift}px)`,
                        transition: "transform 100ms linear",
                    }}
                >
                    <div
                        style={{
                            flex: "1 1 640px",
                            maxWidth: 900,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: 22,
                        }}
                    >
                        {/* Eyebrow */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 12,
                                letterSpacing: "0.24em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.82)",
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 900ms cubic-bezier(0.16, 1, 0.3, 1) both"
                                    : "none",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    width: 28,
                                    height: 1,
                                    background:
                                        "linear-gradient(90deg, rgba(234,141,10,0), rgba(234,141,10,0.95))",
                                }}
                            />
                            AI-powered citizen intelligence
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "#34c759",
                                    boxShadow: "0 0 12px rgba(52,199,89,0.8)",
                                    animation:
                                        "glowPulse 2.2s ease-in-out infinite",
                                }}
                            />
                        </div>

                        {/* सुशासन — Devanagari display */}
                        <h1
                            style={{
                                margin: 0,
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "clamp(76px, 14vw, 180px)",
                                fontWeight: 800,
                                lineHeight: 0.9,
                                letterSpacing: "-0.06em",
                                color: "#f8fafc",
                                textShadow: "0 18px 60px rgba(0,0,0,0.4)",
                                transform: `scale(${headlineScale})`,
                                transformOrigin: "left center",
                                transition: "transform 120ms linear",
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 1100ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both"
                                    : "none",
                            }}
                        >
                            सुशासन
                        </h1>

                        {/* Tricolor rule */}
                        <div
                            style={{
                                width: "min(560px, 100%)",
                                height: 1.5,
                                display: "flex",
                                borderRadius: 2,
                                overflow: "hidden",
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 900ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both"
                                    : "none",
                            }}
                        >
                            <div
                                style={{
                                    flex: 1,
                                    background:
                                        "linear-gradient(90deg, rgba(234,141,10,0.9), rgba(234,141,10,0.7))",
                                }}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    background:
                                        "linear-gradient(90deg, rgba(234,141,10,0.7), rgba(255,255,255,0.55), rgba(19,136,8,0.7))",
                                }}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    background:
                                        "linear-gradient(90deg, rgba(19,136,8,0.7), transparent)",
                                }}
                            />
                        </div>

                        {/* Digital-twin tagline (editorial italic) */}
                        <div
                            style={{
                                margin: 0,
                                fontFamily: "'Fraunces', serif",
                                fontStyle: "italic",
                                fontSize: "clamp(16px, 1.4vw, 19px)",
                                fontWeight: 300,
                                lineHeight: 1.4,
                                letterSpacing: "0.01em",
                                color: "rgba(226,232,240,0.78)",
                                maxWidth: 680,
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 900ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both"
                                    : "none",
                            }}
                        >
                            The digital twin of next-generation Indian
                            governance.
                        </div>

                        {/* Subtitle — word-by-word rise */}
                        <div
                            style={{
                                margin: 0,
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: "clamp(24px, 3vw, 38px)",
                                fontWeight: 500,
                                lineHeight: 1.2,
                                letterSpacing: "-0.025em",
                                color: "#f8fafc",
                                maxWidth: 820,
                                perspective: 1000,
                            }}
                        >
                            {subtitleWords.map((word, i) => {
                                const emphasis =
                                    word === "Sushaasan" ||
                                    word === "signal" ||
                                    word === "scatter"
                                const color =
                                    word === "Sushaasan"
                                        ? "#fbbf24"
                                        : word === "signal"
                                          ? "#34c759"
                                          : word === "scatter"
                                            ? "rgba(148,163,184,0.75)"
                                            : "#f8fafc"
                                return (
                                    <span
                                        key={`${word}-${i}`}
                                        style={{
                                            display: "inline-block",
                                            marginRight: "0.3em",
                                            color,
                                            fontWeight: emphasis ? 700 : 500,
                                            opacity: loaded ? 1 : 0,
                                            animation: loaded
                                                ? `wordRise 720ms cubic-bezier(0.16, 1, 0.3, 1) ${220 + i * 60}ms both`
                                                : "none",
                                            fontStyle:
                                                word === "scatter"
                                                    ? "italic"
                                                    : "normal",
                                        }}
                                    >
                                        {word}
                                    </span>
                                )
                            })}
                        </div>

                        {/* Body */}
                        <p
                            style={{
                                margin: 0,
                                maxWidth: 720,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "clamp(15px, 1.4vw, 18px)",
                                fontWeight: 300,
                                lineHeight: 1.82,
                                color: "rgba(203,213,225,0.82)",
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 980ms cubic-bezier(0.16, 1, 0.3, 1) 1280ms both"
                                    : "none",
                            }}
                        >
                            Every day, 500 million Indians voice opinions across
                            social media — raw, unstructured, lost in the noise.
                            Sushaasan listens. AI synthesises the full public
                            conversation into optimised solutions that balance
                            citizen need with the state's systematic approach.
                            The result: parliament debates with clarity,
                            citizens feel heard before the vote, and governance
                            actually happens — less outrage, less opposition
                            theatre, more work done for India.
                        </p>

                        {/* Stats row — static, no float */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 14,
                                maxWidth: 820,
                                opacity: loaded ? 1 : 0,
                                animation: loaded
                                    ? "heroRise 980ms cubic-bezier(0.16, 1, 0.3, 1) 1460ms both"
                                    : "none",
                            }}
                        >
                            {stats.map((stat) => {
                                const c = toneColors[stat.tone]
                                return (
                                    <div
                                        key={stat.label}
                                        style={{
                                            position: "relative",
                                            padding: "22px 22px 24px",
                                            borderRadius: 20,
                                            background: `linear-gradient(180deg, rgba(11,16,28,0.94), rgba(7,10,18,0.74)), ${c.glow}`,
                                            border: `1px solid ${c.border}`,
                                            backdropFilter: "blur(18px)",
                                            boxShadow: `0 18px 40px rgba(0,0,0,0.28), 0 0 0 1px ${c.glow} inset`,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: 2,
                                                background: `linear-gradient(90deg, transparent, ${c.num}, transparent)`,
                                                opacity: 0.75,
                                            }}
                                        />
                                        <div
                                            style={{
                                                fontFamily:
                                                    "'Poppins', sans-serif",
                                                fontSize: "clamp(34px, 4.2vw, 52px)",
                                                fontWeight: 700,
                                                lineHeight: 1,
                                                letterSpacing: "-0.045em",
                                                color: c.num,
                                                marginBottom: 10,
                                                textShadow: `0 0 28px ${c.glow}`,
                                            }}
                                        >
                                            {stat.value}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "'Inter', sans-serif",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.16em",
                                                textTransform: "uppercase",
                                                color: "rgba(226,232,240,0.9)",
                                            }}
                                        >
                                            {stat.label}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right-column card — single focused statement */}
                    <div
                        style={{
                            flex: "1 1 340px",
                            maxWidth: 420,
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            opacity: loaded ? 1 : 0,
                            animation: loaded
                                ? "heroRise 1100ms cubic-bezier(0.16, 1, 0.3, 1) 1620ms both"
                                : "none",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                padding: 28,
                                borderRadius: 28,
                                background:
                                    "linear-gradient(180deg, rgba(9,13,23,0.94), rgba(6,8,15,0.8))",
                                border: "1px solid rgba(255,255,255,0.12)",
                                boxShadow: "0 24px 54px rgba(0,0,0,0.38)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                overflow: "hidden",
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
                                        "linear-gradient(90deg, rgba(234,141,10,0.9) 0%, rgba(234,141,10,0.9) 33%, rgba(255,255,255,0.95) 50%, rgba(19,136,8,0.9) 66%, rgba(19,136,8,0.9) 100%)",
                                    opacity: 0.82,
                                }}
                            />
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase",
                                    color: "rgba(203,213,225,0.86)",
                                }}
                            >
                                What Sushaasan does
                            </div>
                            <p
                                style={{
                                    margin: 0,
                                    fontFamily: "'Poppins', sans-serif",
                                    fontSize: 30,
                                    lineHeight: 1.18,
                                    letterSpacing: "-0.03em",
                                    color: "#f8fafc",
                                    fontWeight: 600,
                                }}
                            >
                                Chaos <span style={{ color: "#fbbf24" }}>in</span>.{" "}
                                <br />
                                Clarity{" "}
                                <span style={{ color: "#34c759" }}>out</span>.
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: 2,
                                        height: 28,
                                        background: "#60a5fa",
                                        marginLeft: 6,
                                        verticalAlign: "text-bottom",
                                        animation: "caretBlink 1.1s infinite",
                                    }}
                                />
                            </p>
                            <div
                                style={{
                                    width: "100%",
                                    height: 1,
                                    background:
                                        "linear-gradient(90deg, rgba(234,141,10,0.55), rgba(255,255,255,0.22), rgba(19,136,8,0.55), transparent)",
                                }}
                            />
                            <div
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: 14,
                                    lineHeight: 1.75,
                                    color: "rgba(203,213,225,0.82)",
                                }}
                            >
                                Millions of scattered voices enter. AI reads the
                                real sentiment of the country. Government
                                receives an optimised signal it can actually
                                legislate on — before the debate, not after the
                                outrage.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

addPropertyControls(PremiumHero, {
    videoUrl: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm"],
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.58,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
