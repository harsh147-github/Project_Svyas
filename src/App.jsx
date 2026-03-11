import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Github, Twitter, Linkedin, Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════════
   SUAS — Premium Landing Page (Forest Dawn Theme)
   Built with Framer Motion physics + new sections
   ═══════════════════════════════════════════════ */

// ─── Utility: Animated counter ───
const useCounter = (end, duration = 2000, trigger = false) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!trigger) return;
        let start = null;
        const step = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            setVal(Math.floor(end * (1 - Math.pow(1 - p, 4))));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [trigger, end, duration]);
    return val;
};

// ─── Utility: Typewriter ───
const Typewriter = ({ texts, style = {} }) => {
    const [idx, setIdx] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        const text = texts[idx];
        if (!deleting && displayed.length < text.length) {
            const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 50);
            return () => clearTimeout(t);
        } else if (!deleting && displayed.length === text.length) {
            const t = setTimeout(() => setDeleting(true), 2200);
            return () => clearTimeout(t);
        } else if (deleting && displayed.length > 0) {
            const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 25);
            return () => clearTimeout(t);
        } else if (deleting && displayed.length === 0) {
            setDeleting(false);
            setIdx((idx + 1) % texts.length);
        }
    }, [displayed, deleting, idx, texts]);
    return <span style={style}>{displayed}<span style={{ opacity: 0.35, animation: "blink 1s step-end infinite" }}>|</span></span>;
};

// ─── Fade anim variants ───
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AMBIENT BACKGROUND — Forest Dawn Orbs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const orbs = [
    { size: 800, x: "-5%", y: "-15%", color: "var(--accent-light)", dur: "20s", delay: "0s", kf: "orbFloat1" },
    { size: 600, x: "75%", y: "-10%", color: "var(--sunrise-soft)", dur: "25s", delay: "-5s", kf: "orbFloat2" },
    { size: 450, x: "50%", y: "60%", color: "rgba(123,109,175,0.06)", dur: "22s", delay: "-8s", kf: "orbFloat3" },
];

const InteractiveBackground = () => {
    const glowRef = useRef(null);
    useEffect(() => {
        const el = glowRef.current;
        if (!el) return;
        const h = (e) => {
            el.style.setProperty("--cx", e.clientX + "px");
            el.style.setProperty("--cy", e.clientY + "px");
        };
        window.addEventListener("mousemove", h, { passive: true });
        return () => window.removeEventListener("mousemove", h);
    }, []);

    return (
        <>
            <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
                {orbs.map((o, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: o.x,
                            top: o.y,
                            width: o.size,
                            height: o.size,
                            borderRadius: "50%",
                            background: `radial-gradient(circle, ${o.color}, transparent 60%)`,
                            animation: `${o.kf} ${o.dur} ease-in-out ${o.delay} infinite`,
                            willChange: "transform",
                        }}
                    />
                ))}
            </div>
            <div ref={glowRef} className="cursor-glow" />
        </>
    );
};
const CursorGlow = () => null;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NAVBAR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 30);
        window.addEventListener("scroll", h, { passive: true });
        return () => window.removeEventListener("scroll", h);
    }, []);

    const links = ["Philosophy", "Story", "How It Works", "Platform"];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                padding: scrolled ? "12px 0" : "20px 0",
                transition: "padding 0.5s cubic-bezier(0.16,1,0.3,1)",
            }}
        >
            <div className="container-w">
                <div
                    className="glass"
                    style={{
                        borderRadius: 100,
                        padding: "12px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: scrolled ? "rgba(247, 249, 245, 0.95)" : "rgba(247, 249, 245, 0.8)",
                        transition: "background 0.5s",
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "var(--accent)", color: "#fff",
                            display: "grid", placeItems: "center",
                        }}>
                            <span style={{ fontWeight: 800, fontSize: 14, fontFamily: "var(--sans)", letterSpacing: "-0.03em" }}>S.</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                            <span style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, color: "var(--text)" }}>SUAS</span>
                            <span style={{ fontFamily: "var(--sans)", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.06em" }}>स्वास · pure breath</span>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="nav-links-desktop">
                        {links.map((l) => (
                            <a
                                key={l}
                                href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                                style={{
                                    fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500, color: "var(--text-muted)",
                                    transition: "color 0.3s", cursor: "pointer"
                                }}
                                onMouseOver={(e) => (e.target.style.color = "var(--text)")}
                                onMouseOut={(e) => (e.target.style.color = "var(--text-muted)")}
                            >
                                {l}
                            </a>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <a href="/build.html" className="btn btn-s" style={{ padding: "10px 24px", fontSize: 13, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                            🚀 Build Space
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "var(--sunrise)", padding: "2px 8px", borderRadius: 6, letterSpacing: "0.03em" }}>BETA</span>
                        </a>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{
                                display: "none", background: "none", border: "none",
                                color: "var(--text)", cursor: "pointer", padding: 4,
                            }}
                            className="mobile-menu-btn"
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ padding: "12px var(--px)", marginTop: 8 }}
                    >
                        <div className="glass" style={{ borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                            {links.map((l) => (
                                <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMobileOpen(false)}
                                    style={{ fontSize: 16, fontWeight: 500, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                                    {l}
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 768px) {
                    .nav-links-desktop { display: none !important; }
                    .mobile-menu-btn { display: block !important; }
                }
            `}</style>
        </motion.nav>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HERO — Manifesto
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Hero = () => {
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
    const opacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

    const manifestoLines = [
        "Stop asking if you're worthy.",
        "Stop chasing tags.",
        "Stop grieving rejections.",
    ];

    return (
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 0 60px", overflow: "hidden" }}>
            <motion.div style={{ scale, opacity }} className="container-w">
                <div style={{ position: "relative", zIndex: 2, maxWidth: 960 }}>

                    {/* Manifesto Lines */}
                    <div style={{ marginBottom: 48 }}>
                        {manifestoLines.map((line, i) => (
                            <motion.div key={i} {...fadeUp(0.3 + i * 0.15)} style={{ marginBottom: 4 }}>
                                <p style={{
                                    fontFamily: "var(--sans)", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 500,
                                    color: "var(--text-muted)", margin: 0, lineHeight: 1.7, letterSpacing: "-0.01em",
                                }}>{line}</p>
                            </motion.div>
                        ))}
                        <motion.div {...fadeUp(0.8)} style={{ marginTop: 16 }}>
                            <p style={{
                                fontFamily: "var(--serif)", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 400,
                                color: "var(--text)", margin: 0, lineHeight: 1.6, fontStyle: "italic",
                            }}>
                                If you're curious enough to solve a problem — <span style={{ color: "var(--accent)" }}>that's the only credential you need.</span>
                            </p>
                        </motion.div>
                    </div>

                    {/* Divider line */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 80 }}
                        transition={{ duration: 1.2, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: 3, background: `linear-gradient(90deg, var(--accent), var(--sunrise))`, borderRadius: 2, marginBottom: 48 }}
                    />

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: "clamp(64px, 10vw, 130px)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.05,
                            color: "var(--sunrise)",
                            fontStyle: "italic",
                            margin: 0
                        }}
                    >
                        Shut up.
                    </motion.h1>
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 1.45, ease: [0.16, 1, 0.3, 1] }}
                        className="text-shimmer"
                        style={{
                            fontSize: "clamp(64px, 10vw, 130px)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.05,
                            marginBottom: 40,
                            margin: 0
                        }}
                    >
                        And solve.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" }}
                        style={{
                            fontFamily: "var(--sans)", fontSize: "clamp(18px, 2vw, 22px)", lineHeight: 1.85, color: "var(--text-muted)",
                            maxWidth: 600, marginBottom: 48, marginTop: 40
                        }}
                    >
                        You don't need a degree. You don't need skills. You don't need to know how.
                        <br /><strong style={{ color: "var(--text)", fontSize: "clamp(20px, 2.2vw, 24px)" }}>You just need to want to.</strong>
                        <br />Come aboard. You'll learn alongside the people already solving.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 2.1, ease: "easeOut" }}
                        style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}
                    >
                        <a href="/build.html" className="btn btn-p" style={{ fontSize: 18, padding: "18px 48px", borderRadius: 12 }}>
                            Start Building <ArrowRight size={18} />
                        </a>
                        <a href="#story" className="btn btn-s" style={{ fontSize: 18, padding: "18px 48px", borderRadius: 12 }}>
                            Read Our Story
                        </a>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 2.5, duration: 1 }}
                style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
                <span style={{ fontSize: 10, fontFamily: "var(--sans)", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--text-dim)" }}>Scroll</span>
                <div style={{ width: 1, height: 36, background: `linear-gradient(var(--text-dim), transparent)`, animation: "scrollPulse 2s ease-in-out infinite" }} />
            </motion.div>
        </section>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BREATH SECTION — The Philosophy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BreathSection = () => (
    <section id="philosophy" className="section-pad" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <motion.div {...fadeUp()}>
                <span className="serif" style={{ fontSize: 64, color: "var(--sunrise)", fontStyle: "italic", display: "block", marginBottom: 8 }}>स्वास</span>
                <span style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", letterSpacing: "0.2em", textTransform: "uppercase" }}>SUAS · Pure Breath</span>
            </motion.div>
            <motion.h2 {...fadeUp(0.12)} style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400, color: "var(--text)", lineHeight: 1.35, margin: "40px 0", letterSpacing: "-0.01em" }}>
                Breathing isn't something you earn permission to do.
                <br />Building shouldn't be either.
            </motion.h2>
            <motion.p {...fadeUp(0.18)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.9, color: "var(--text-muted)", marginBottom: 28 }}>
                Richard Feynman — one of the greatest minds to ever live — didn't call himself smart. He said he was just curious. He said if you're curious enough to ask questions and stubborn enough to chase answers, you're a scientist. Not because someone gave you a degree. Because you chose to be.
            </motion.p>
            <motion.p {...fadeUp(0.22)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.9, color: "var(--text-muted)", marginBottom: 28 }}>
                We believe the same thing about everything. Want to solve a problem in healthcare but you're a 12th grader? Come aboard — you'll learn alongside the people already working on it. Don't know how to code but you're obsessed with making cities more walkable? Come aboard — someone here needs your obsession.
            </motion.p>
            <motion.div {...fadeUp(0.26)} className="card-premium" style={{ marginTop: 20, padding: "44px 52px", borderRadius: 16 }}>
                <p className="serif" style={{ fontSize: "clamp(24px, 3vw, 32px)", color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                    You don't need to know everything to begin.
                    <br />You just need to <span style={{ color: "var(--sunrise)" }}>want to begin.</span>
                </p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTERACTIVE STATS COUNTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const StatsBar = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });
    const s1 = useCounter(73, 2200, isInView);
    const s2 = useCounter(89, 2400, isInView);
    const s3 = useCounter(12, 1800, isInView);

    return (
        <div ref={ref} style={{ padding: "80px 0", background: "var(--dark)", borderTop: "1px solid var(--dark-border)", borderBottom: "1px solid var(--dark-border)" }}>
            <div className="container" style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, textAlign: "center" }}>
                {[
                    { val: `${s1}%`, label: "of students feel unqualified to start building before graduating", icon: "📊" },
                    { val: `${s2}%`, label: "of breakthroughs came from people who were 'not qualified' on paper", icon: "🔬" },
                    { val: `${s3}M+`, label: "students every year lose their spark chasing approval instead of building", icon: "💡" },
                ].map((s, i) => (
                    <motion.div key={i} {...fadeUp(0.1 + i * 0.1)} style={{ padding: "24px 16px" }}>
                        <span style={{ fontSize: 24, display: "block", marginBottom: 12 }}>{s.icon}</span>
                        <span className="serif" style={{ fontSize: "clamp(40px, 5vw, 60px)", fontWeight: 400, color: "var(--sunrise)", display: "block", lineHeight: 1 }}>{s.val}</span>
                        <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "#7E9478", marginTop: 12, lineHeight: 1.6, margin: "12px auto 0", maxWidth: 240 }}>{s.label}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE WEIGHT WE CARRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const phases = [
    { emoji: "📋", phase: "The Exam", desc: "JEE. NEET. AIIMS. UPSC. Campus placements. It doesn't matter which one. The system says: prove yourself in 3 hours, on this one day, in this one format. Or you're out.", color: "var(--danger)", time: "1 day" },
    { emoji: "💔", phase: "The Rejection", desc: "You didn't make it. And suddenly everyone has an opinion. Your family. Your classmates. LinkedIn. The voice inside your own head saying: maybe I'm just not good enough.", color: "var(--danger)", time: "Instant" },
    { emoji: "🌀", phase: "The Spiral", desc: "Am I worthy? Am I smart enough? Who am I to build anything — they're at IIT, she's at Stanford, he's at Google. I'm... here. In a college nobody's heard of. With no tag. No badge. Nothing.", color: "var(--warm)", time: "Months" },
    { emoji: "🏃", phase: "The Chase", desc: "You pick yourself up. But instead of building, you start chasing the NEXT tag. Another exam. Another application. Another year spent earning the right to begin.", color: "var(--warm)", time: "1–3 years" },
    { emoji: "🔇", phase: "The Quiet Death", desc: "One day it stops hurting — because you stopped caring. You got a safe job. The thing you wanted to build? Still in a corner of your mind. Gathering dust. The world lost a solution it never knew existed.", color: "var(--text-dim)", time: "Forever" },
];

const WeightSection = () => (
    <section id="story" className="section-pad">
        <div className="container" style={{ maxWidth: 920 }}>
            <motion.span {...fadeUp()} style={{ fontFamily: "var(--sans)", display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--danger)", marginBottom: 20 }}>
                The Weight We Carry
            </motion.span>
            <motion.h2 {...fadeUp(0.08)} className="serif" style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 400, color: "var(--text)", lineHeight: 1.2, margin: "24px 0 20px" }}>
                We don't lose to lack of talent.<br />
                We lose to the voice that says<br />
                <span className="serif" style={{ color: "var(--danger)", fontStyle: "italic" }}>"who are you to even try?"</span>
            </motion.h2>
            <motion.p {...fadeUp(0.12)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.85, color: "var(--text-muted)", maxWidth: 640, marginBottom: 60 }}>
                Millions of people — not just in India, everywhere — wake up every morning carrying the weight of a rejection. And instead of building, they spend years on three things that produce nothing: grieving, chasing the next approval, or just feeling paralyzed.
            </motion.p>

            {/* Timeline */}
            <div style={{ position: "relative", paddingLeft: 56, marginBottom: 72 }}>
                <div style={{ position: "absolute", left: 26, top: 8, bottom: 8, width: 2, borderRadius: 1, background: `linear-gradient(var(--danger), var(--warm), var(--text-dim))` }} />
                {phases.map((p, i) => (
                    <motion.div key={i} {...fadeUp(0.04 + i * 0.06)} style={{ display: "flex", gap: 28, marginBottom: 8, position: "relative", padding: "20px 0" }}>
                        <div style={{
                            position: "absolute", left: -42, top: 24, width: 34, height: 34, borderRadius: "50%",
                            background: "var(--bg)", border: `2px solid ${p.color}35`, display: "grid", placeItems: "center", fontSize: 16, zIndex: 2,
                            boxShadow: `0 0 0 5px var(--bg)`,
                        }}>{p.emoji}</div>
                        <div className="card-premium" style={{ flex: 1, padding: "28px 36px", borderRadius: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <h4 className="serif" style={{ fontSize: 26, fontWeight: 400, color: p.color, margin: 0 }}>{p.phase}</h4>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "var(--text-dim)", padding: "4px 12px", borderRadius: 100, background: "var(--bg-2)", fontWeight: 600 }}>{p.time}</span>
                            </div>
                            <p style={{ fontFamily: "var(--sans)", fontSize: 16, lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>{p.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div {...fadeUp(0.1)} className="card-premium" style={{ padding: "56px 60px", borderRadius: 20, textAlign: "center" }}>
                <p className="serif" style={{ fontSize: "clamp(26px, 3.5vw, 34px)", color: "var(--text)", lineHeight: 1.5, margin: "0 0 28px" }}>
                    Why are you wasting time being sad<br />when you could be <span style={{ color: "var(--sunrise)", fontStyle: "italic" }}>building?</span>
                </p>
                <p style={{ fontFamily: "var(--sans)", fontSize: 17, color: "var(--text-muted)", lineHeight: 1.75, maxWidth: 560, margin: "0 auto" }}>
                    Someone will tell you it's impossible. Someone will ask "how will you do it, you're not from a great place." So what? You have technology. You have open source. You have the internet. And most importantly — you have the desire. That's enough. <strong style={{ color: "var(--text)" }}>That was always enough.</strong>
                </p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE SUAS WAY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const typewriterTexts = [
    "a class 11 student fascinated by quantum physics",
    "a JEE aspirant who didn't clear the cutoff",
    "a developer from a college no one's heard of",
    "someone rejected from AIIMS who still loves medicine",
    "a 40-year-old who just discovered they love robotics",
    "someone who has no idea where to start",
    "anyone who simply refuses to give up",
];

const pillars = [
    { icon: "🌱", title: "Desire is the only entry ticket", desc: "Not skills. Not knowledge. Not experience. A class 11 student who doesn't know quantum phenomena but wants to learn? Welcome aboard. You'll grow here — alongside people who'll help you, not judge you.", color: "var(--green)" },
    { icon: "🤝", title: "Collaboration over competition", desc: "Two companies fighting to solve the same problem is waste. Two strangers coming together to solve it is progress. We normalize building together — across backgrounds, across skill levels, across borders.", color: "var(--blue)" },
    { icon: "🫥", title: "Build anonymously if you want", desc: "Worried your identity will be exposed for solving a problem others find \"too small\"? Work anonymously. No judgment. The problem doesn't care about your name. It just needs to be solved.", color: "var(--violet)" },
    { icon: "❤️", title: "Heart over everything", desc: "A guy who's great at coding but not from Google? Welcome. A beginner who doesn't know anything yet but wants to learn with all their heart? Equally welcome. We bet on desire, not tags.", color: "var(--sunrise)" },
];

const SUASWay = () => {
    return (
        <section className="section-pad" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div className="container" style={{ maxWidth: 1000 }}>
                <motion.span {...fadeUp()} style={{ fontFamily: "var(--sans)", display: "block", fontSize: 13, fontWeight: 700, color: "var(--sunrise)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 20 }}>
                    Come As You Are
                </motion.span>
                <motion.h2 {...fadeUp(0.08)} className="serif" style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 400, color: "var(--text)", lineHeight: 1.2, margin: "24px 0 16px" }}>
                    What if someone who<br />
                    <Typewriter texts={typewriterTexts} style={{ color: "var(--sunrise)", fontStyle: "italic" }} /><br />
                    is exactly who we need?
                </motion.h2>
                <motion.p {...fadeUp(0.12)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.85, color: "var(--text-muted)", maxWidth: 620, marginBottom: 64 }}>
                    You're learning. You're at a stage where you don't know everything. That's not a weakness — <strong style={{ color: "var(--text)" }}>that's the most natural place to be.</strong> Rather than waiting until you're "ready," come aboard and learn while contributing.
                </motion.p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: 16, marginBottom: 64 }}>
                    {pillars.map((p, i) => (
                        <motion.div key={i} {...fadeUp(0.04 + i * 0.07)} className="card-premium">
                            <span style={{ fontSize: 40, display: "block", marginBottom: 24, padding: "10px", borderRadius: "14px", background: `${p.color}15`, width: "max-content" }}>{p.icon}</span>
                            <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "var(--text)", margin: "0 0 12px" }}>{p.title}</h3>
                            <p style={{ fontFamily: "var(--sans)", fontSize: 16, lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>{p.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Comparison */}
                <motion.div {...fadeUp(0.15)} className="card-premium" style={{ padding: 0, borderRadius: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        <div style={{ padding: "20px 36px", background: "var(--bg-2)", borderBottom: `1px solid var(--border)`, borderRight: `1px solid var(--border)` }}>
                            <span style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--danger)", letterSpacing: "0.15em", textTransform: "uppercase" }}>How the world works today</span>
                        </div>
                        <div style={{ padding: "20px 36px", background: "var(--accent-light)", borderBottom: `1px solid var(--border)` }}>
                            <span style={{ fontFamily: "var(--sans)", fontSize: 12, fontWeight: 700, color: "var(--sunrise)", letterSpacing: "0.15em", textTransform: "uppercase" }}>How SUAS works</span>
                        </div>
                    </div>
                    {[
                        ['"Show me your credentials first"', '"Show me your curiosity"'],
                        ["You need skills to contribute", "You need desire — you'll learn the skills here"],
                        ["Compete against each other", "Solve together"],
                        ["Wait until you're \"ready\"", "Start now, learn by doing"],
                        ["Trust based on logos on a resume", "Trust based on showing up with heart"],
                        ["Chase tags for years, then build", "Build today — the tag is what you built"],
                        ["Sulk over rejection", "Channel that energy into something real"],
                    ].map(([left, right], i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: i < 6 ? `1px solid var(--border)` : "none" }}>
                            <div style={{ padding: "16px 36px", borderRight: `1px solid var(--border)` }}>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--text-dim)" }}>{left}</span>
                            </div>
                            <div style={{ padding: "16px 36px", background: "var(--accent-super-light)" }}>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 16, color: "var(--text)", fontWeight: 500 }}>{right}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HOW IT WORKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const howSteps = [
    { n: "01", title: "Tell us what excites you", desc: "Not your resume. Not your GPA. Just — what keeps you up at night? What problem do you wish someone would solve? Or are you already solving one and need people? Start there.", icon: "💭", color: "var(--accent)" },
    { n: "02", title: "Find your people", desc: "We'll connect you with others who share your obsession — or who are working on something that needs exactly your kind of curiosity. No followers needed. No tags checked. Just genuine fit.", icon: "🫂", color: "var(--blue)" },
    { n: "03", title: "Learn while building", desc: "You don't need to arrive fully formed. Contribute what you can today. Watch. Ask questions. Grow alongside people who want you there. Your contribution can be a question that nobody else thought to ask.", icon: "🌿", color: "var(--green)" },
    { n: "04", title: "Your journey becomes your story", desc: "\"Started as a curious 12th grader. Contributed to 3 projects in renewable energy. Now leads a team of 8.\" That story is worth more than any degree — because it's real.", icon: "📖", color: "var(--warm)" },
];

const HowItWorks = () => (
    <section id="how-it-works" className="section-pad">
        <div className="container" style={{ maxWidth: 920 }}>
            <motion.span {...fadeUp()} style={{ fontFamily: "var(--sans)", display: "block", fontSize: 13, fontWeight: 700, color: "var(--sunrise)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 20 }}>
                How It Works
            </motion.span>
            <motion.h2 {...fadeUp(0.08)} className="serif" style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 400, color: "var(--text)", lineHeight: 1.2, margin: "24px 0 64px" }}>
                As natural as breathing.
            </motion.h2>

            {howSteps.map((step, i) => (
                <motion.div key={i} {...fadeUp(0.04 + i * 0.07)} className="card-premium" style={{ display: "flex", gap: 32, padding: "36px 40px", marginBottom: 14, borderRadius: 18 }}>
                    <div style={{ minWidth: 60 }}>
                        <span className="serif" style={{ fontSize: 48, color: `${step.color}30`, fontWeight: 400, lineHeight: 1 }}>{step.n}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                            <span style={{ fontSize: 24 }}>{step.icon}</span>
                            <h3 className="serif" style={{ fontSize: 28, fontWeight: 400, color: "var(--text)", margin: 0 }}>{step.title}</h3>
                        </div>
                        <p style={{ fontFamily: "var(--sans)", fontSize: 16, lineHeight: 1.8, color: "var(--text-muted)", margin: 0 }}>{step.desc}</p>
                    </div>
                </motion.div>
            ))}

            <motion.div {...fadeUp(0.3)} className="card-premium" style={{ marginTop: 40, padding: "36px 40px", borderRadius: 18, border: `1px solid var(--accent-med)`, background: "var(--accent-light)", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {["Get curious", "Find your people", "Learn & build together", "Grow your story", "Inspire others to start"].map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "var(--sans)", padding: "10px 20px", borderRadius: 10, fontSize: 15, fontWeight: 600, background: "var(--accent-soft)", color: "var(--sunrise)", border: `1px solid var(--accent-med)`, whiteSpace: "nowrap" }}>{s}</span>
                            {i < 4 && <span style={{ color: "var(--text-dim)", fontSize: 16 }}>→</span>}
                        </div>
                    ))}
                    <span style={{ color: "var(--sunrise)", fontSize: 20, marginLeft: 4 }}>↻</span>
                </div>
                <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--text-muted)", margin: 0 }}>The desire to solve creates the learning. The learning creates the solutions. The solutions inspire more desire.</p>
            </motion.div>
        </div>
    </section>
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AI AGENTS — Your Building Crew
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AIAgentsSection = () => {
    const [activeAgent, setActiveAgent] = useState(null);
    const [demoStep, setDemoStep] = useState(0);
    const [demoRunning, setDemoRunning] = useState(false);

    const agents = [
        { icon: "🧠", name: "Ideation", role: "Thinks with you", color: "var(--accent)", desc: "Describe your problem in plain language. This agent helps you shape a fuzzy thought into a real, buildable idea. Like a co-founder who never sleeps." },
        { icon: "⚙️", name: "Builder", role: "Builds with you", color: "var(--blue)", desc: "Don't know how to code? Describe what you want built and the builder agent writes, tests, and iterates the code alongside you." },
        { icon: "🔍", name: "Research", role: "Maps the space", color: "var(--green)", desc: "Need to understand a domain? This agent reads papers, maps the landscape, and gives you a knowledge advantage in hours." },
        { icon: "🤝", name: "Connector", role: "Finds your tribe", color: "var(--violet)", desc: "Scans SUAS for others solving adjacent problems. Suggests collaborations that make sense. No awkward networking." },
        { icon: "📣", name: "Launch", role: "Ships to the world", color: "var(--warm)", desc: "Helps you get your solution in front of the right people — writes pitches, identifies communities, and creates rollout plans." },
    ];

    const demoSteps = [
        { who: "you", text: "\"I want to help street vendors track their daily income\"" },
        { who: "agent", text: "Shaping it: SMS-based tracker, no smartphone needed. MVP scope: income logging, daily summaries. Pilot: 5 vendors.", emoji: "🧠" },
        { who: "agent", text: "47M street vendors in India. 93% keep no records. Found 2 projects to learn from. Gap: non-smartphone usage.", emoji: "🔍" },
        { who: "agent", text: "Prototype ready: SMS interface for logging, WhatsApp summary. Deployed.", emoji: "⚙️" },
        { who: "agent", text: "Found 6 people on SUAS in financial inclusion. 2 joining — one fintech dev, one NGO worker.", emoji: "🤝" },
        { who: "agent", text: "Pitch drafted. Connected with NGO for a pilot in 3 cities. Documentation ready.", emoji: "📣" },
    ];

    useEffect(() => {
        if (!demoRunning) return;
        if (demoStep >= demoSteps.length) { setDemoRunning(false); return; }
        const t = setTimeout(() => setDemoStep(s => s + 1), 2600);
        return () => clearTimeout(t);
    }, [demoStep, demoRunning]);

    const startDemo = () => { setDemoStep(0); setDemoRunning(true); setTimeout(() => setDemoStep(1), 200); };
    const resetDemo = () => { setDemoStep(0); setDemoRunning(false); };

    return (
        <section id="platform" style={{ padding: 0, background: "var(--dark)", position: "relative", overflow: "hidden" }}>
            <div style={{ padding: "80px 0", background: `linear-gradient(var(--bg), var(--dark))` }}>
                <div className="container" style={{ textAlign: "center" }}>
                    <motion.p {...fadeUp()} className="serif" style={{ fontSize: "clamp(22px, 3vw, 30px)", color: "var(--text-muted)", fontStyle: "italic", maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
                        "But what if I don't want to wait for people?<br />What if I want to <span style={{ color: "var(--sunrise)" }}>start building right now?</span>"
                    </motion.p>
                </div>
            </div>

            <div className="section-pad">
                <div className="container-w" style={{ position: "relative", zIndex: 1, maxWidth: 1060 }}>
                    <motion.span {...fadeUp()} style={{ fontFamily: "var(--sans)", display: "block", fontSize: 13, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 20 }}>
                        The Platform
                    </motion.span>
                    <motion.h2 {...fadeUp(0.08)} className="serif" style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 400, color: "#E4EBE0", lineHeight: 1.2, margin: "24px 0 16px" }}>
                        You don't need a team of 10.<br />
                        You need <span className="serif" style={{ color: "var(--sunrise)", fontStyle: "italic" }}>AI agents that work like 10.</span>
                    </motion.h2>
                    <motion.p {...fadeUp(0.14)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.85, color: "#7E9478", maxWidth: 680, marginBottom: 20 }}>
                        Here's the reality nobody's telling you: building something meaningful has never been more possible for one person with an idea. You don't need venture capital. You don't need a technical co-founder.
                    </motion.p>
                    <motion.p {...fadeUp(0.18)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", lineHeight: 1.85, color: "#7E9478", maxWidth: 680, marginBottom: 80 }}>
                        SUAS is a <strong style={{ color: "#C4D4BE" }}>complete building platform</strong> — a system of specialized AI agents that work alongside you at every stage. From <strong style={{ color: "#C4D4BE" }}>"I have a vague idea"</strong> to <strong style={{ color: "#C4D4BE" }}>"this is live."</strong>
                    </motion.p>

                    {/* Agents Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 40 }}>
                        {agents.map((a, i) => (
                            <motion.div key={i} {...fadeUp(0.04 + i * 0.05)}
                                onClick={() => setActiveAgent(activeAgent === i ? null : i)}
                                style={{
                                    padding: "28px 20px", borderRadius: 16, cursor: "pointer", textAlign: "center",
                                    background: activeAgent === i ? "var(--dark-card)" : "rgba(26,26,23,0.4)",
                                    border: `1.5px solid ${activeAgent === i ? a.color : "var(--dark-border)"}`,
                                    boxShadow: activeAgent === i ? `0 20px 60px ${a.color}12` : "none",
                                }}
                                whileHover={{ y: -5 }} animate={activeAgent === i ? { scale: 1.02, y: -8 } : { scale: 1, y: 0 }}
                            >
                                <motion.span style={{ fontSize: 36, display: "block", marginBottom: 14 }} animate={activeAgent === i ? { scale: 1.25 } : { scale: 1 }}>{a.icon}</motion.span>
                                <h4 className="serif" style={{ fontSize: 19, fontWeight: 400, color: activeAgent === i ? "#E4EBE0" : "#7A9072", margin: "0 0 6px" }}>{a.name}</h4>
                                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: a.color, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{a.role}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Agent details */}
                    <AnimatePresence>
                        {activeAgent !== null && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 80 }}>
                                <div style={{ padding: "40px", borderRadius: 20, background: "var(--dark-card)", border: `1px solid ${agents[activeAgent].color}30`, marginTop: 16 }}>
                                    <h3 className="serif" style={{ fontSize: 28, color: "#E4EBE0", margin: "0 0 16px" }}>{agents[activeAgent].name} Agent</h3>
                                    <p style={{ fontFamily: "var(--sans)", fontSize: 16, color: "#7E9478", margin: 0 }}>{agents[activeAgent].desc}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Live Demo Terminal */}
                    <motion.div {...fadeUp(0.2)} style={{ padding: "44px", borderRadius: 20, background: "var(--dark-card)", border: "1px solid var(--dark-border)", marginBottom: 80 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
                            <div>
                                <h3 className="serif" style={{ fontSize: 28, color: "#E4EBE0", margin: "0 0 4px" }}>From idea to impact</h3>
                                <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "#6A8062", margin: 0 }}>One person. One problem. Five agents. Real result.</p>
                            </div>
                            <button onClick={demoRunning ? resetDemo : startDemo} style={{
                                padding: "12px 32px", borderRadius: 10,
                                background: demoRunning ? "transparent" : "var(--accent)", color: demoRunning ? "#7E9478" : "#fff",
                                border: demoRunning ? "1px solid var(--dark-border)" : "none",
                                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)",
                            }}>
                                {demoRunning ? "Reset" : "▶ Run Demo"}
                            </button>
                        </div>
                        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--dark-border)", background: "var(--dark)" }}>
                            <div style={{ padding: "10px 16px", background: "#0B1610", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--dark-border)" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#E8694A" }} />
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#D4933A" }} />
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3A8A5C" }} />
                                <span style={{ fontFamily: "var(--sans)", fontSize: 11, color: "#3E5438", marginLeft: 12 }}>suas-agents — live workflow</span>
                            </div>
                            <div style={{ padding: "24px 28px", minHeight: 280, display: "flex", flexDirection: "column", gap: 16 }}>
                                {demoStep === 0 && !demoRunning && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "#344A30", fontFamily: "var(--sans)", fontSize: 15 }}>
                                        Press "Run Demo" to watch the agents in action →
                                    </div>
                                )}
                                {demoSteps.slice(0, demoStep).map((s, i) => (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                        <div style={{
                                            minWidth: 36, height: 36, borderRadius: 10,
                                            background: s.who === "you" ? "rgba(43,107,79,0.2)" : "var(--dark-card)",
                                            border: `1px solid ${s.who === "you" ? "rgba(43,107,79,0.3)" : "var(--dark-border)"}`,
                                            display: "grid", placeItems: "center", fontSize: s.who === "you" ? 14 : 18,
                                        }}>{s.who === "you" ? "👤" : s.emoji}</div>
                                        <div style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: s.who === "you" ? "rgba(43,107,79,0.1)" : "rgba(255,255,255,0.02)" }}>
                                            <p style={{ fontFamily: "var(--sans)", fontSize: 14, lineHeight: 1.7, color: s.who === "you" ? "#C4D4BE" : "#7E9478", margin: 0 }}>
                                                {s.who === "you" ? <em>{s.text}</em> : s.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                                {demoRunning && demoStep < demoSteps.length && (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
                                        <span style={{ fontFamily: "var(--sans)", fontSize: 12, color: "#3E5438" }}>Agent compiling...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WINDOW SCROLLING PROMPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const WindowScrollPrompt = () => {
    const [response, setResponse] = useState("");
    const [submitted, setSubmitted] = useState(false);
    return (
        <section style={{ padding: "120px 0", background: "var(--dark)", position: "relative" }}>
            <div className="container" style={{ maxWidth: 740, textAlign: "center" }}>
                <motion.span {...fadeUp()} style={{ fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Hey, wait a second</motion.span>
                <motion.h2 {...fadeUp(0.1)} className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", color: "#E4EBE0", marginBottom: 16 }}>We know you're just window-scrolling.</motion.h2>
                <motion.p {...fadeUp(0.2)} style={{ fontFamily: "var(--sans)", fontSize: "clamp(17px, 1.8vw, 20px)", color: "#7E9478", marginBottom: 48 }}>
                    But we don't want you to leave empty-handed. So here's a real question:<br />
                    <strong style={{ color: "#C4D4BE" }}>If you were to build a platform like this, how would you?</strong>
                </motion.p>
                <motion.div {...fadeUp(0.3)}>
                    {!submitted ? (
                        <div style={{ textAlign: "left", background: "var(--dark-card)", borderRadius: 16, border: "2px solid var(--dark-border)", padding: "20px" }}>
                            <textarea
                                value={response} onChange={e => setResponse(e.target.value)}
                                placeholder="Honestly, I think..."
                                style={{ width: "100%", minHeight: 140, background: "transparent", border: "none", outline: "none", color: "#E4EBE0", fontSize: 17 }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                                <button
                                    onClick={() => setSubmitted(true)}
                                    disabled={response.length < 5}
                                    className="btn btn-p"
                                    style={{ padding: "10px 24px", fontSize: 14 }}
                                >
                                    Share thoughts
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "40px", background: "var(--dark-card)", borderRadius: 16, border: "1px solid var(--accent-med)" }}>
                            <span style={{ fontSize: 40, display: "block", marginBottom: 20 }}>🙏</span>
                            <h3 className="serif" style={{ fontSize: 32, color: "#E4EBE0", margin: "0 0 16px" }}>That means the world.</h3>
                            <p style={{ fontFamily: "var(--sans)", color: "#7E9478", margin: 0 }}>You just proved you think about building things. Maybe you should come aboard?</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </section>
    )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CTA 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CTASection = () => (
    <section id="join" className="section-pad" style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: 720 }}>
            <motion.p {...fadeUp()} className="serif" style={{ fontSize: 24, color: "var(--text-dim)", fontStyle: "italic", margin: "0 0 48px", lineHeight: 1.7 }}>
                "I was not smart. I was just curious."
                <br /><span style={{ fontSize: 16 }}>— Richard Feynman</span>
            </motion.p>
            <motion.h2 {...fadeUp(0.1)} className="serif" style={{ fontSize: "clamp(44px, 7vw, 80px)", color: "var(--text)", lineHeight: 1.1, margin: "0 0 32px" }}>
                You're curious?<br /><span style={{ color: "var(--sunrise)", fontStyle: "italic" }}>That's enough.</span>
            </motion.h2>
            <motion.div {...fadeUp(0.18)}>
                <p style={{ fontFamily: "var(--sans)", fontSize: "clamp(18px, 2vw, 21px)", color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.85 }}>
                    Don't know where to start? Neither did anyone else.
                    <br />Don't have the skills yet? You'll learn them here.
                </p>
                <p className="serif" style={{ fontSize: "clamp(28px, 4vw, 34px)", color: "var(--sunrise)", margin: "0 0 48px", fontStyle: "italic" }}>
                    Shut up and solve.
                </p>
            </motion.div>
            <motion.div {...fadeUp(0.26)}>
                <a href="/build.html" className="btn btn-p" style={{ padding: "20px 64px", fontSize: 20 }}>
                    Start Building <ArrowRight size={20} />
                </a>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Footer = () => (
    <footer style={{ padding: "60px 0 40px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div className="container">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 40, marginBottom: 48 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center" }}>
                            <span style={{ fontWeight: 800, fontSize: 12, fontFamily: "var(--sans)" }}>S.</span>
                        </div>
                        <span className="serif" style={{ fontSize: 20, color: "var(--text)" }}>SUAS</span>
                    </div>
                    <p style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--text-dim)", maxWidth: 300, margin: 0 }}>
                        As natural as breathing. A space where curiosity is the only credential.
                    </p>
                </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--text-dim)" }}>© 2026 SUAS · Built with desire, not degrees.</span>
            </div>
        </div>
    </footer>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
    return (
        <div style={{ minHeight: "100vh", position: "relative" }}>
            <InteractiveBackground />
            <CursorGlow />
            <Navbar />
            <Hero />
            <BreathSection />
            <StatsBar />
            <WeightSection />
            <SUASWay />
            <HowItWorks />
            <AIAgentsSection />
            <WindowScrollPrompt />
            <CTASection />
            <Footer />
        </div>
    );
}

