// Hero section with video background, overlay, and content for Sushasan
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useRef, useEffect, type CSSProperties } from "react"

interface HeroSectionProps {
    videoUrl: string
    overlayOpacity: number
    label: string
    title: string
    subtitle: string
    btn1Text: string
    btn2Text: string
    stat1Value: string
    stat1Label: string
    stat2Value: string
    stat2Label: string
    stat3Value: string
    stat3Label: string
    gradientFrom: string
    gradientTo: string
    overlayColor: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HeroSection(props: HeroSectionProps) {
    const {
        videoUrl = "https://files.catbox.moe/pguib9.mp4",
        overlayOpacity = 0.7,
        label = "Collective Intelligence for Good Governance",
        title = "Collective Intelligence Engine",
        subtitle = "Transforming how India's 500 million+ citizens connect with decision-makers through AI-powered synthesis and structured insights.",
        btn1Text = "Join the Movement",
        btn2Text = "Learn More",
        stat1Value = "500M+",
        stat1Label = "Citizens Connected",
        stat2Value = "5s",
        stat2Label = "Processing Time",
        stat3Value = "10,000+",
        stat3Label = "Solutions Processed",
        gradientFrom = "#1e40af",
        gradientTo = "#ea8d0a",
        overlayColor = "#0a0f1a",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && !isStatic) {
            videoRef.current.play().catch(() => {})
        }
    }, [isStatic])

    const gradientStyle: CSSProperties = {
        background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
    }

    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                ...style,
            }}
        >
            {/* Video Background */}
            {!isStatic ? (
                <video
                    ref={videoRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        minWidth: "100%",
                        minHeight: "100%",
                        width: "auto",
                        height: "auto",
                        transform: "translate(-50%, -50%)",
                        objectFit: "cover",
                        zIndex: 0,
                    }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={videoUrl}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: `linear-gradient(135deg, ${overlayColor} 0%, #1a202c 100%)`,
                        zIndex: 0,
                    }}
                />
            )}

            {/* Dark Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: overlayColor,
                    opacity: overlayOpacity,
                    zIndex: 1,
                }}
            />

            {/* Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "center",
                    maxWidth: 900,
                    padding: "0 2rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                }}
            >
                {/* Label */}
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        ...gradientStyle,
                    }}
                >
                    {label}
                </span>

                {/* Title */}
                <h1
                    style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: 72,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                        ...gradientStyle,
                    }}
                >
                    {title}
                </h1>

                {/* Subtitle */}
                <p
                    style={{
                        fontSize: 20,
                        color: "#cbd5e1",
                        fontWeight: 300,
                        lineHeight: 1.7,
                        maxWidth: 700,
                        margin: 0,
                    }}
                >
                    {subtitle}
                </p>

                {/* Buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: 20,
                        marginTop: 16,
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    <button
                        style={{
                            padding: "16px 40px",
                            borderRadius: 50,
                            fontSize: 16,
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            background: `linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)`,
                            color: "#ffffff",
                            boxShadow: "0 4px 20px rgba(30, 64, 175, 0.3)",
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {btn1Text}
                    </button>
                    <button
                        style={{
                            padding: "16px 40px",
                            borderRadius: 50,
                            fontSize: 16,
                            fontWeight: 600,
                            border: "2px solid rgba(255, 255, 255, 0.3)",
                            cursor: "pointer",
                            background: "transparent",
                            color: "#ffffff",
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {btn2Text}
                    </button>
                </div>

                {/* Stats */}
                <div
                    style={{
                        display: "flex",
                        gap: 64,
                        justifyContent: "center",
                        paddingTop: 32,
                        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                        marginTop: 16,
                        flexWrap: "wrap",
                    }}
                >
                    {[
                        { value: stat1Value, label: stat1Label },
                        { value: stat2Value, label: stat2Label },
                        { value: stat3Value, label: stat3Label },
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: "center" }}>
                            <div
                                style={{
                                    fontSize: 42,
                                    fontWeight: 700,
                                    fontFamily: "'Poppins', sans-serif",
                                    ...gradientStyle,
                                }}
                            >
                                {stat.value}
                            </div>
                            <div
                                style={{
                                    fontSize: 14,
                                    color: "#94a3b8",
                                    marginTop: 8,
                                    fontWeight: 500,
                                }}
                            >
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Google Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
                rel="stylesheet"
            />
        </section>
    )
}

addPropertyControls(HeroSection, {
    videoUrl: {
        type: ControlType.File,
        allowedFileTypes: ["mp4", "webm", "mov"],
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#0a0f1a",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#1e40af",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#ea8d0a",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Collective Intelligence for Good Governance",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Collective Intelligence Engine",
        displayTextArea: true,
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Transforming how India's 500 million+ citizens connect with decision-makers through AI-powered synthesis and structured insights.",
        displayTextArea: true,
    },
    btn1Text: {
        type: ControlType.String,
        title: "Button 1",
        defaultValue: "Join the Movement",
    },
    btn2Text: {
        type: ControlType.String,
        title: "Button 2",
        defaultValue: "Learn More",
    },
    stat1Value: {
        type: ControlType.String,
        title: "Stat 1 Value",
        defaultValue: "500M+",
    },
    stat1Label: {
        type: ControlType.String,
        title: "Stat 1 Label",
        defaultValue: "Citizens Connected",
    },
    stat2Value: {
        type: ControlType.String,
        title: "Stat 2 Value",
        defaultValue: "5s",
    },
    stat2Label: {
        type: ControlType.String,
        title: "Stat 2 Label",
        defaultValue: "Processing Time",
    },
    stat3Value: {
        type: ControlType.String,
        title: "Stat 3 Value",
        defaultValue: "10,000+",
    },
    stat3Label: {
        type: ControlType.String,
        title: "Stat 3 Label",
        defaultValue: "Solutions Processed",
    },
})
