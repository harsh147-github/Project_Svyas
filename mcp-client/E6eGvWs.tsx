// Scroll Reveal Section — Intersection Observer powered reveal animations
import { addPropertyControls, ControlType } from "framer"
import { useRef, useEffect, useState, type CSSProperties, type ReactNode } from "react"

interface Props {
    children?: ReactNode
    direction?: "up" | "left" | "right" | "scale"
    delay?: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScrollRevealSection(props: Props) {
    const {
        children,
        direction = "up",
        delay = 0,
        style,
    } = props

    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.05, rootMargin: "0px 0px -60px 0px" }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    const transforms: Record<string, string> = {
        up: "translateY(60px)",
        left: "translateX(-60px)",
        right: "translateX(60px)",
        scale: "scale(0.95)",
    }

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "none" : transforms[direction],
                transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
                willChange: "opacity, transform",
                ...style,
            }}
        >
            {children}
        </div>
    )
}

addPropertyControls(ScrollRevealSection, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "left", "right", "scale"],
        optionTitles: ["Up", "Left", "Right", "Scale"],
        defaultValue: "up",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay (s)",
        defaultValue: 0,
        min: 0, max: 2, step: 0.1,
    },
})
