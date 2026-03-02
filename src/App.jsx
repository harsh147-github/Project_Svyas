import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, Github, Twitter, Linkedin, Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";

/* ═══════════════════════════════════════════════
   SUAS — Premium Landing Page (Dark Theme)
   Original SUAS content + elevated visual design
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

// ─── Card spotlight ───
const useCardSpotlight = () => {
    const ref = useRef(null);
    const onMove = (e) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ref.current.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        ref.current.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    return { ref, onMove };
};

// ─── Fade anim variants ───
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AMBIENT BACKGROUND — Floating Orbs + Cursor Glow
//  Pure CSS transforms → GPU-composited, zero CPU
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const orbs = [
    { size: 600, x: "15%", y: "10%", color: "rgba(238,255,71,0.07)", dur: "20s", delay: "0s", kf: "orbFloat1" },
    { size: 500, x: "75%", y: "5%", color: "rgba(96,165,250,0.05)", dur: "25s", delay: "-5s", kf: "orbFloat2" },
    { size: 450, x: "50%", y: "60%", color: "rgba(167,139,250,0.04)", dur: "22s", delay: "-8s", kf: "orbFloat3" },
    { size: 350, x: "85%", y: "70%", color: "rgba(238,255,71,0.05)", dur: "28s", delay: "-12s", kf: "orbFloat1" },
    { size: 300, x: "10%", y: "80%", color: "rgba(45,212,191,0.04)", dur: "24s", delay: "-3s", kf: "orbFloat2" },
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
            {/* Dot grid */}
            <div className="dot-grid" />
            {/* Floating ambient orbs — CSS only */}
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
                            background: `radial-gradient(circle, ${o.color}, transparent 70%)`,
                            animation: `${o.kf} ${o.dur} ease-in-out ${o.delay} infinite`,
                            willChange: "transform",
                            filter: "blur(40px)",
                        }}
                    />
                ))}
            </div>
            {/* Cursor glow */}
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

    const links = ["Philosophy", "Story", "Join"];

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
                        background: scrolled ? "rgba(5,5,5,0.7)" : "rgba(5,5,5,0.3)",
                        transition: "background 0.5s",
                    }}
                >
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: "var(--accent)",
                            display: "grid", placeItems: "center",
                        }}>
                            <span style={{ fontWeight: 900, fontSize: 13, color: "#000", fontFamily: "var(--display)", letterSpacing: "-0.03em" }}>S.</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                            <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 400, color: "var(--text)" }}>SUAS</span>
                            <span style={{ fontSize: 9, color: "var(--text-4)", letterSpacing: "0.06em" }}>स्वास · pure breath</span>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links-desktop">
                        {links.map((l) => (
                            <a
                                key={l}
                                href={`#${l.toLowerCase()}`}
                                style={{
                                    fontSize: 13, fontWeight: 500, color: "var(--text-3)",
                                    transition: "color 0.3s", letterSpacing: "0.02em",
                                }}
                                onMouseOver={(e) => (e.target.style.color = "var(--accent)")}
                                onMouseOut={(e) => (e.target.style.color = "var(--text-3)")}
                            >
                                {l}
                            </a>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <a href="/build.html" className="btn btn-s" style={{ padding: "10px 24px", fontSize: 13 }}>
                            Build Space
                        </a>
                        <a href="#join" className="btn btn-p" style={{ padding: "10px 24px", fontSize: 13 }}>
                            Come Aboard
                        </a>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{
                                display: "none", background: "none", border: "none",
                                color: "#fff", cursor: "pointer", padding: 4,
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
                                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileOpen(false)}
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
//  CREDENTIAL MARQUEE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CredentialMarquee = () => {
    const tags = ["IIT Delhi", "ex-Google", "Stanford CS", "YC W24", "ex-NVIDIA", "MIT Media Lab", "a16z backed", "ex-Meta", "Harvard MBA", "ex-Apple"];
    const doubled = [...tags, ...tags];
    return (
        <div style={{ overflow: "hidden", width: "100%", padding: "0 0 40px" }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1 }}
            >
                <div className="marquee-track">
                    {doubled.map((t, i) => (
                        <span key={i} className="marquee-tag">{t}</span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HERO — Original SUAS content
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Hero = () => {
    const [m, setM] = useState(false);
    const { scrollYProgress } = useScroll();
    const scale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
    const opacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

    useEffect(() => { setTimeout(() => setM(true), 300); }, []);

    return (
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
            {/* Ambient glows */}
            <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 900, height: 600, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(238,255,71,0.06), transparent 70%)", pointerEvents: "none", animation: "glow-breathe 6s ease-in-out infinite" }} />
            <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(238,255,71,0.03), transparent 70%)", pointerEvents: "none" }} />

            <motion.div style={{ scale, opacity }} className="container" >
                <div style={{ textAlign: "center", position: "relative", zIndex: 2, paddingTop: 120 }}>
                    <CredentialMarquee />

                    {/* SUAS eyebrow */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: m ? 1 : 0, y: m ? 0 : 15 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        style={{ marginBottom: 32 }}
                    >
                        <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 100 }}>
                            <span style={{ fontSize: 14, color: "var(--text-3)" }}>SUAS</span>
                            <span style={{ fontSize: 14, color: "var(--text-4)" }}>·</span>
                            <span style={{ fontSize: 14, color: "var(--text-4)" }}>स्वास</span>
                            <span style={{ fontSize: 14, color: "var(--text-4)" }}>·</span>
                            <span className="serif" style={{ fontSize: 14, color: "var(--text-3)", fontStyle: "italic" }}>pure breath — as natural as breathing</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="text-shimmer"
                        style={{
                            fontSize: "clamp(48px, 10vw, 130px)",
                            letterSpacing: "-0.05em",
                            lineHeight: 0.95,
                            marginBottom: 12,
                        }}
                    >
                        Shut up.
                    </motion.h1>
                    <motion.h1
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                        className="text-shimmer"
                        style={{
                            fontSize: "clamp(48px, 10vw, 130px)",
                            letterSpacing: "-0.05em",
                            lineHeight: 0.95,
                            marginBottom: 36,
                        }}
                    >
                        <span className="serif" style={{ WebkitTextFillColor: "var(--accent)", fontStyle: "italic" }}>
                            And solve.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            fontSize: "clamp(16px, 2vw, 19px)",
                            color: "var(--text-2)",
                            maxWidth: 540,
                            margin: "0 auto 44px",
                            fontWeight: 300,
                            lineHeight: 1.85,
                        }}
                    >
                        You don't need a degree. You don't need skills. You don't need to know how.
                        <br /><strong style={{ color: "var(--text)", fontWeight: 600 }}>You just need to want to.</strong>
                        <br />Come aboard. You'll learn alongside the people already solving.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}
                    >
                        <a href="/build.html" className="btn btn-p" style={{ fontSize: 16, padding: "18px 40px" }}>
                            Come Aboard <ArrowRight size={18} />
                        </a>
                        <a href="#story" className="btn btn-s" style={{ fontSize: 16, padding: "18px 40px" }}>
                            Read Our Story
                        </a>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-4)" }}>Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                >
                    <ChevronDown size={16} style={{ color: "var(--text-4)" }} />
                </motion.div>
            </motion.div>
        </section>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BREATH SECTION — THE PHILOSOPHY (original)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const BreathSection = () => (
    <section id="philosophy" className="section-pad" style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
            <motion.div {...fadeUp()}>
                <span className="serif" style={{ fontSize: 56, color: "var(--accent)", fontStyle: "italic", display: "block", marginBottom: 8 }}>स्वास</span>
                <span style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>SUAS · Pure Breath</span>
            </motion.div>
            <motion.h2 {...fadeUp(0.12)} style={{ fontSize: "clamp(28px, 4vw, 44px)", marginBottom: 36, marginTop: 36, lineHeight: 1.35 }}>
                <span className="serif">Breathing isn't something you earn permission to do.</span>
                <br /><span className="serif">Building shouldn't be either.</span>
            </motion.h2>
            <motion.p {...fadeUp(0.18)} style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-2)", marginBottom: 28 }}>
                Richard Feynman — one of the greatest minds to ever live — didn't call himself smart. He said he was just curious. He said if you're curious enough to ask questions and stubborn enough to chase answers, you're a scientist. Not because someone gave you a degree. Because you chose to be.
            </motion.p>
            <motion.p {...fadeUp(0.22)} style={{ fontSize: 17, lineHeight: 1.9, color: "var(--text-2)", marginBottom: 28 }}>
                We believe the same thing about everything. Want to solve a problem in healthcare but you're a 12th grader? Come aboard — you'll learn alongside the people already working on it. Don't know how to code but you're obsessed with making cities more walkable? Come aboard — someone here needs your obsession.
            </motion.p>
            <motion.div {...fadeUp(0.26)} className="glass" style={{ padding: "36px 44px", borderRadius: 20 }}>
                <p className="serif" style={{ fontSize: 26, color: "var(--text)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                    You don't need to know everything to begin.
                    <br />You just need to <span style={{ color: "var(--accent)" }}>want to begin.</span>
                </p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE WEIGHT WE CARRY (original timeline)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const phases = [
    { phase: "The Exam", desc: "JEE. NEET. AIIMS. UPSC. Campus placements. It doesn't matter which one. The system says: prove yourself in 3 hours, on this one day, in this one format. Or you're out.", color: "#F87171", time: "1 day" },
    { phase: "The Rejection", desc: "You didn't make it. And suddenly everyone has an opinion. Your family. Your classmates. LinkedIn. The voice inside your own head saying: maybe I'm just not good enough.", color: "#F87171", time: "Instant" },
    { phase: "The Spiral", desc: "Am I worthy? Am I smart enough? Who am I to build anything — they're at IIT, she's at Stanford, he's at Google. I'm... here. In a college nobody's heard of. With no tag. No badge. Nothing.", color: "#FBBF24", time: "Months" },
    { phase: "The Chase", desc: "You pick yourself up. But instead of building, you start chasing the NEXT tag. Another exam. Another application. Another year spent earning the right to begin.", color: "#FBBF24", time: "1–3 years" },
    { phase: "The Quiet Death", desc: "One day it stops hurting — because you stopped caring. You got a safe job. The thing you wanted to build? Still in a corner of your mind. Gathering dust. The world lost a solution it never knew existed.", color: "var(--text-4)", time: "Forever" },
];

const WeightSection = () => (
    <section id="story" className="section-pad" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 860 }}>
            <motion.span {...fadeUp()} style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#F87171", marginBottom: 20, fontFamily: "var(--display)" }}>
                The Weight We Carry
            </motion.span>
            <motion.h2 {...fadeUp(0.08)} style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 16, lineHeight: 1.2 }}>
                We don't lose to lack of talent.<br />
                We lose to the voice that says<br />
                <span className="serif" style={{ color: "#F87171", fontStyle: "italic" }}>"who are you to even try?"</span>
            </motion.h2>
            <motion.p {...fadeUp(0.12)} style={{ fontSize: 17, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 600, marginBottom: 56 }}>
                Millions of people — not just in India, everywhere — wake up every morning carrying the weight of a rejection. And instead of building, they spend years on three things that produce nothing: grieving, chasing the next approval, or just feeling paralyzed.
            </motion.p>

            {/* Timeline */}
            <div style={{ position: "relative", paddingLeft: 52, marginBottom: 64 }}>
                <div style={{ position: "absolute", left: 24, top: 8, bottom: 8, width: 2, borderRadius: 1, background: "linear-gradient(rgba(248,113,113,0.4), rgba(251,191,36,0.4), rgba(90,114,102,0.25))" }} />
                {phases.map((p, i) => (
                    <motion.div key={i} {...fadeUp(0.04 + i * 0.06)} style={{ display: "flex", gap: 24, marginBottom: 6, position: "relative", padding: "18px 0" }}>
                        <div style={{
                            position: "absolute", left: -40, top: 22, width: 30, height: 30, borderRadius: "50%",
                            background: "var(--bg)", border: `2px solid ${p.color}35`, display: "grid", placeItems: "center", fontSize: 14, zIndex: 2,
                            boxShadow: "0 0 0 5px var(--bg)",
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                        </div>
                        <div className="card-premium" style={{
                            flex: 1, padding: "24px 32px", borderRadius: 16, cursor: "default",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <h4 className="serif" style={{ fontSize: 22, fontWeight: 400, color: p.color, margin: 0 }}>{p.phase}</h4>
                                <span style={{ fontSize: 10, color: "var(--text-4)", padding: "3px 10px", borderRadius: 100, background: "var(--bg-elevated)", fontWeight: 600 }}>{p.time}</span>
                            </div>
                            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-3)", margin: 0 }}>{p.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom callout */}
            <motion.div {...fadeUp(0.1)} className="glass" style={{ padding: "48px 52px", borderRadius: 20, textAlign: "center" }}>
                <p className="serif" style={{ fontSize: 28, color: "var(--text)", lineHeight: 1.5, margin: "0 0 24px" }}>
                    Why are you wasting time being sad<br />when you could be <span style={{ color: "var(--accent)", fontStyle: "italic" }}>building?</span>
                </p>
                <p style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.75, maxWidth: 520, margin: "0 auto" }}>
                    Someone will tell you it's impossible. Someone will ask "how will you do it, you're not from a great place." So what? You have technology. You have open source. You have the internet. And most importantly — you have the desire. That's enough. <strong style={{ color: "var(--text)" }}>That was always enough.</strong>
                </p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VISION — FOUNDER'S NOTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VisionSection = () => (
    <section id="vision" className="section-pad" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 860 }}>
            <motion.div {...fadeUp()} className="glass" style={{ padding: "60px 48px", borderRadius: 32, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(238,255,71,0.03), transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent)", display: "grid", placeItems: "center", fontWeight: 800, color: "#000", fontSize: 18 }}>H</div>
                        <div>
                            <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Harsh Sonavane</h3>
                            <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>Founder, SUAS</p>
                        </div>
                    </div>

                    <p className="serif" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", lineHeight: 1.5, color: "var(--text)", fontStyle: "italic", marginBottom: 36, letterSpacing: "-0.01em" }}>
                        "I’m Harsh Sonavane, and SUAS is my attempt to end the taboo that building real-world solutions is just for ‘geniuses.’ It isn’t. You just have to be deterministic enough to solve. I want to normalize that."
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40, borderTop: "1px solid var(--border)", paddingTop: 36 }}>
                        <div>
                            <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-2)", margin: 0 }}>
                                People think starting up is hard because they believe they have to give up everything. I want to build a new era where the slightest observation of any problem in the world—no matter how small—can be solved for everyone. You just need to find like-minded people along the way who share your obsession.
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: 15, lineHeight: 1.9, color: "var(--text-2)", margin: 0 }}>
                                Every year, lakhs of students chase labels like IIT or NEET. But with today's technology, you don't need a fancy title to ideate or solve at the ground level. Common sense and a will to solve is enough. Let’s normalize collaboration over unnecessary competition. That is why I built SUAS.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  THE SUAS WAY — COME AS YOU ARE
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
    { title: "Desire is the only entry ticket", desc: "Not skills. Not knowledge. Not experience. A class 11 student who doesn't know quantum phenomena but wants to learn? Welcome aboard. You'll grow here — alongside people who'll help you, not judge you.", color: "#2DD4BF" },
    { title: "Collaboration over competition", desc: "Two companies fighting to solve the same problem is waste. Two strangers coming together to solve it is progress. We normalize building together — across backgrounds, across skill levels, across borders.", color: "#60A5FA" },
    { title: "Build anonymously if you want", desc: 'Worried your identity will be exposed for solving a problem others find "too small"? Work anonymously. No judgment. The problem doesn\'t care about your name. It just needs to be solved.', color: "#A78BFA" },
    { title: "Heart over everything", desc: "A guy who's great at coding but not from Google? Welcome. A beginner who doesn't know anything yet but wants to learn with all their heart? Equally welcome. We bet on desire, not tags.", color: "var(--accent)" },
];

const SUASWay = () => {
    const [hov, setHov] = useState(null);
    return (
        <section className="section-pad" style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            <div className="container" style={{ maxWidth: 960 }}>
                <motion.span {...fadeUp()} style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20, fontFamily: "var(--display)" }}>
                    Come As You Are
                </motion.span>
                <motion.h2 {...fadeUp(0.08)} style={{ fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1.2, marginBottom: 12 }}>
                    What if someone who<br />
                    <Typewriter texts={typewriterTexts} style={{ color: "var(--accent)", fontStyle: "italic", fontFamily: "var(--serif)" }} /><br />
                    is exactly who we need?
                </motion.h2>
                <motion.p {...fadeUp(0.12)} style={{ fontSize: 17, lineHeight: 1.85, color: "var(--text-2)", maxWidth: 580, marginBottom: 56 }}>
                    You're learning. You're at a stage where you don't know everything. That's not a weakness — <strong style={{ color: "var(--text)" }}>that's the most natural place to be.</strong> Rather than waiting until you're "ready," come aboard and learn while contributing. You'll be surprised how much the world needs someone who simply cares.
                </motion.p>

                {/* Pillar cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 16, marginBottom: 56 }}>
                    {pillars.map((p, i) => (
                        <motion.div key={i} {...fadeUp(0.04 + i * 0.07)}
                            onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
                            className="card-premium"
                            style={{
                                padding: "40px 36px", cursor: "default", height: "100%",
                                borderColor: hov === i ? `${p.color}30` : undefined,
                                transform: hov === i ? "translateY(-6px)" : "none",
                                boxShadow: hov === i ? `0 12px 40px ${p.color}08` : undefined,
                                transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
                            }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: `${p.color}10`, border: `1px solid ${p.color}20`,
                                display: "grid", placeItems: "center", marginBottom: 24,
                                transition: "transform 0.3s", transform: hov === i ? "scale(1.12)" : "scale(1)",
                            }}>
                                <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.color }} />
                            </div>
                            <h3 className="serif" style={{ fontSize: 24, fontWeight: 400, color: "var(--text)", margin: "0 0 10px" }}>{p.title}</h3>
                            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-3)", margin: 0 }}>{p.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Comparison table */}
                <motion.div {...fadeUp(0.15)} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                        <div style={{ padding: "18px 32px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#F87171", letterSpacing: "0.15em", textTransform: "uppercase" }}>How the world works today</span>
                        </div>
                        <div style={{ padding: "18px 32px", background: "rgba(238,255,71,0.03)", borderBottom: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase" }}>How SUAS works</span>
                        </div>
                    </div>
                    {[
                        ['"Show me your credentials first"', '"Show me your curiosity"'],
                        ["You need skills to contribute", "You need desire — you'll learn the skills here"],
                        ["Compete against each other", "Solve together"],
                        ['Wait until you\'re "ready"', "Start now, learn by doing"],
                        ["Trust based on logos on a resume", "Trust based on showing up with heart"],
                        ["Chase tags for years, then build", "Build today — the tag is what you built"],
                        ["Sulk over rejection", "Channel that energy into something real"],
                    ].map(([left, right], i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: i < 6 ? "1px solid var(--border)" : "none" }}>
                            <div style={{ padding: "14px 32px", borderRight: "1px solid var(--border)" }}>
                                <span style={{ fontSize: 14, color: "var(--text-4)" }}>{left}</span>
                            </div>
                            <div style={{ padding: "14px 32px", background: "rgba(238,255,71,0.03)" }}>
                                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{right}</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HOW IT WORKS (original steps)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const howSteps = [
    { n: "01", title: "Tell us what excites you", desc: "Not your resume. Not your GPA. Just — what keeps you up at night? What problem do you wish someone would solve? Or are you already solving one and need people? Start there.", color: "var(--accent)" },
    { n: "02", title: "Find your people", desc: "We'll connect you with others who share your obsession — or who are working on something that needs exactly your kind of curiosity. No followers needed. No tags checked. Just genuine fit.", color: "#60A5FA" },
    { n: "03", title: "Learn while building", desc: "You don't need to arrive fully formed. Contribute what you can today. Watch. Ask questions. Grow alongside people who want you there. Your contribution can be a question that nobody else thought to ask.", color: "#2DD4BF" },
    { n: "04", title: "Your journey becomes your story", desc: '"Started as a curious 12th grader. Contributed to 3 projects in renewable energy. Now leads a team of 8." That story is worth more than any degree — because it\'s real.', color: "#FBBF24" },
];

const HowItWorks = () => (
    <section className="section-pad" style={{ background: "var(--bg)" }}>
        <div className="container" style={{ maxWidth: 860 }}>
            <motion.span {...fadeUp()} style={{ display: "block", fontSize: 13, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 20, fontFamily: "var(--display)" }}>
                How It Works
            </motion.span>
            <motion.h2 {...fadeUp(0.08)} className="serif" style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 56 }}>
                As natural as breathing.
            </motion.h2>

            {howSteps.map((step, i) => (
                <motion.div key={i} {...fadeUp(0.04 + i * 0.07)} className="card-premium" style={{
                    display: "flex", gap: 28, padding: "32px 36px", marginBottom: 12, cursor: "default",
                }}>
                    <div style={{ minWidth: 56 }}>
                        <span className="serif" style={{ fontSize: 40, color: `${step.color}20`, fontWeight: 400, lineHeight: 1 }}>{step.n}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: step.color }} />
                            <h3 className="serif" style={{ fontSize: 24, fontWeight: 400, color: "var(--text)", margin: 0 }}>{step.title}</h3>
                        </div>
                        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--text-3)", margin: 0 }}>{step.desc}</p>
                    </div>
                </motion.div>
            ))}

            {/* Flow loop */}
            <motion.div {...fadeUp(0.3)} style={{ marginTop: 36, padding: "32px 36px", borderRadius: 20, border: "1px solid rgba(238,255,71,0.1)", background: "rgba(238,255,71,0.03)", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {["Get curious", "Find your people", "Learn & build together", "Grow your story", "Inspire others to start"].map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "rgba(238,255,71,0.08)", color: "var(--accent)", border: "1px solid rgba(238,255,71,0.15)", whiteSpace: "nowrap" }}>{s}</span>
                            {i < 4 && <span style={{ color: "var(--text-4)", fontSize: 14 }}>→</span>}
                        </div>
                    ))}
                    <span style={{ color: "var(--accent)", fontSize: 18, marginLeft: 2 }}>↻</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>The desire to solve creates the learning. The learning creates the solutions. The solutions inspire more desire.</p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CTA (original content)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CTASection = () => (
    <section id="join" className="section-pad" style={{ position: "relative", overflow: "hidden", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
        <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 1000, height: 500, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(238,255,71,0.05), transparent 60%)",
            pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative", zIndex: 2, maxWidth: 680, textAlign: "center" }}>
            <motion.p {...fadeUp()} className="serif" style={{ fontSize: 20, color: "var(--text-4)", fontStyle: "italic", margin: "0 0 44px", lineHeight: 1.7 }}>
                "I was not smart. I was just curious."
                <br /><span style={{ fontSize: 14, color: "var(--text-4)" }}>— Richard Feynman</span>
            </motion.p>
            <motion.h2 {...fadeUp(0.1)} style={{ fontSize: "clamp(40px, 6vw, 72px)", marginBottom: 28, lineHeight: 1.1 }}>
                You're curious?<br />
                <span className="serif" style={{ color: "var(--accent)", fontStyle: "italic" }}>That's enough.</span>
            </motion.h2>
            <motion.div {...fadeUp(0.18)}>
                <p style={{ fontSize: 17, color: "var(--text-2)", margin: "0 0 12px", lineHeight: 1.85 }}>
                    Don't know where to start? Neither did anyone else when they began.
                    <br />Don't have the skills yet? You'll learn them here.
                    <br />Worried you're not good enough?
                </p>
                <p className="serif" style={{ fontSize: 26, color: "var(--text)", margin: "0 0 44px", fontStyle: "italic" }}>
                    Shut up and solve.
                </p>
            </motion.div>
            <motion.div {...fadeUp(0.26)}>
                <a href="/build.html" className="btn btn-p" style={{ padding: "18px 56px", fontSize: 18 }}>
                    Come Aboard <ArrowRight size={18} />
                </a>
                <p style={{ fontSize: 12, color: "var(--text-4)", marginTop: 16 }}>
                    No credentials. No skills required. No experience needed.<br />Just you, your curiosity, and the desire to solve.
                </p>
            </motion.div>
        </div>
    </section>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Footer = () => (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "60px 0 40px" }}>
        <div className="container">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 40, marginBottom: 48 }}>
                {/* Brand */}
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent)", display: "grid", placeItems: "center" }}>
                            <span style={{ fontWeight: 900, fontSize: 11, color: "#000", fontFamily: "var(--display)" }}>S.</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                            <span className="serif" style={{ fontSize: 17 }}>SUAS</span>
                            <span style={{ fontSize: 9, color: "var(--text-4)" }}>स्वास · pure breath</span>
                        </div>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-4)", maxWidth: 280, lineHeight: 1.6 }}>
                        As natural as breathing · © 2026
                    </p>
                </div>

                {/* Links */}
                <div style={{ display: "flex", gap: 64 }}>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 16 }}>Platform</p>
                        {["Manifesto", "Build Space", "Come Aboard"].map((l) => (
                            <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "var(--text-3)", padding: "6px 0", transition: "color 0.3s" }}
                                onMouseOver={(e) => (e.target.style.color = "#fff")}
                                onMouseOut={(e) => (e.target.style.color = "var(--text-3)")}>
                                {l}
                            </a>
                        ))}
                    </div>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 16 }}>Legal</p>
                        {["Privacy", "Terms"].map((l) => (
                            <a key={l} href="#" style={{ display: "block", fontSize: 14, color: "var(--text-3)", padding: "6px 0", transition: "color 0.3s" }}
                                onMouseOver={(e) => (e.target.style.color = "#fff")}
                                onMouseOut={(e) => (e.target.style.color = "var(--text-3)")}>
                                {l}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Social */}
                <div style={{ display: "flex", gap: 16 }}>
                    {[
                        { Icon: Twitter, href: "#" },
                        { Icon: Github, href: "#" },
                        { Icon: Linkedin, href: "#" },
                    ].map(({ Icon, href }, i) => (
                        <a key={i} href={href} style={{
                            width: 40, height: 40, borderRadius: 10,
                            border: "1px solid var(--border)", display: "grid", placeItems: "center",
                            color: "var(--text-4)", transition: "all 0.3s",
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-4)"; }}
                        >
                            <Icon size={16} />
                        </a>
                    ))}
                </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <p style={{ fontSize: 12, color: "var(--text-4)", letterSpacing: "0.08em" }}>
                    Built without permission. © 2026 SUAS
                </p>
                <a href="/build.html" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", display: "flex", alignItems: "center", gap: 6, transition: "gap 0.3s" }}
                    onMouseOver={(e) => (e.currentTarget.style.gap = "10px")}
                    onMouseOut={(e) => (e.currentTarget.style.gap = "6px")}>
                    Enter Build Space <ArrowUpRight size={14} />
                </a>
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
            <WeightSection />
            <VisionSection />
            <SUASWay />
            <HowItWorks />
            <CTASection />
            <Footer />
        </div>
    );
}
