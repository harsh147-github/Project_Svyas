/* ═══════════════════════════════════════════════════
   SUSHASAN — Animation Engine
   Lenis Smooth Scroll + GSAP ScrollTrigger
   ═══════════════════════════════════════════════════ */

// ── Lenis Smooth Scroll ──
const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
});

// Connect Lenis to GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// ── Preloader ──
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    gsap.to(preloader, {
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
            preloader.classList.add('done');
            animateHero();
        }
    });
});

// ── Hero Animations ──
function animateHero() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Animate each word in the title
    tl.to('.hero h1 .word-inner', {
        y: 0, opacity: 1,
        duration: 1.2,
        stagger: 0.08,
    })
    .to('.hero-subtitle', {
        y: 0, opacity: 1, duration: 1,
    }, '-=0.8')
    .to('.hero-desc', {
        y: 0, opacity: 1, duration: 0.8,
    }, '-=0.6')
    .to('.hero-stat', {
        y: 0, opacity: 1, duration: 0.7,
        stagger: 0.1,
    }, '-=0.5')
    .to('.hero-scroll', {
        opacity: 1, duration: 0.6,
    }, '-=0.3');
}

// ── Section Heading Reveals ──
gsap.utils.toArray('.section-label, .section-heading, .section-desc').forEach(el => {
    gsap.from(el, {
        y: 60, opacity: 0, duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Card Stagger Reveals ──
gsap.utils.toArray('.grid, .dual-box').forEach(grid => {
    const children = grid.children;
    gsap.from(children, {
        y: 60, opacity: 0, duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: grid,
            start: 'top 82%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Timeline Steps Reveal ──
gsap.utils.toArray('.timeline-step').forEach((step, i) => {
    gsap.from(step, {
        x: -40, opacity: 0, duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: step,
            start: 'top 85%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Stat Counter Animation ──
gsap.utils.toArray('.stat-num[data-count]').forEach(el => {
    const target = el.getAttribute('data-count');
    const suffix = el.getAttribute('data-suffix') || '';
    const isFloat = target.includes('.');

    ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: parseFloat(target),
                duration: 2,
                ease: 'power2.out',
                onUpdate: () => {
                    el.textContent = (isFloat ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix;
                }
            });
        }
    });
});

// ── Bar Chart Animation ──
gsap.utils.toArray('.bar-fill').forEach(bar => {
    const w = bar.getAttribute('data-width');
    ScrollTrigger.create({
        trigger: bar,
        start: 'top 90%',
        once: true,
        onEnter: () => {
            gsap.to(bar, { width: w, duration: 1.6, ease: 'power3.out' });
        }
    });
});

// ── Parallax on Images ──
gsap.utils.toArray('.parallax-img-wrap img').forEach(img => {
    gsap.to(img, {
        yPercent: -15,
        ease: 'none',
        scrollTrigger: {
            trigger: img.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5,
        }
    });
});

// ── Section Dividers ──
gsap.utils.toArray('.section-divider').forEach(div => {
    gsap.from(div, {
        width: 0, duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: div,
            start: 'top 90%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Network Nodes ──
gsap.utils.toArray('.net-node').forEach((node, i) => {
    gsap.from(node, {
        scale: 0, opacity: 0, duration: 0.7,
        delay: i * 0.06,
        ease: 'back.out(1.7)',
        scrollTrigger: {
            trigger: '.network-viz',
            start: 'top 75%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Dashboard Mock Slide-in ──
gsap.utils.toArray('.dash-priority').forEach((row, i) => {
    gsap.from(row, {
        x: 80, opacity: 0, duration: 0.7,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: row,
            start: 'top 90%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Phase Cards ──
gsap.utils.toArray('.phase-card').forEach((card, i) => {
    gsap.from(card, {
        y: 80, opacity: 0, duration: 0.9,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: card.parentElement,
            start: 'top 80%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Nav Scroll Effect ──
ScrollTrigger.create({
    start: 80,
    onUpdate: (self) => {
        document.querySelector('.nav').classList.toggle('scrolled', self.scroll() > 80);
    }
});

// ── Hero Parallax ──
gsap.to('.hero-content', {
    yPercent: 30, opacity: 0.3,
    ease: 'none',
    scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
    }
});

// ── Hero Canvas: Floating Particles ──
(function () {
    const c = document.getElementById('heroCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H;

    function resize() {
        W = c.width = c.offsetWidth;
        H = c.height = c.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const nodes = [];
    const N = 50;
    const colors = [
        'rgba(255,153,51,',   // saffron
        'rgba(19,136,8,',     // green
        'rgba(37,99,235,',    // blue
        'rgba(255,255,255,',  // white
    ];

    for (let i = 0; i < N; i++) {
        nodes.push({
            x: Math.random() * 2000,
            y: Math.random() * 1200,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Connection lines
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 160) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 * (1 - d / 160)) + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        // Nodes + glow
        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = n.color + '0.5)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
            ctx.fillStyle = n.color + '0.04)';
            ctx.fill();

            n.x += n.vx;
            n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
        }

        requestAnimationFrame(draw);
    }
    draw();
})();

// ── CTA Section Zoom ──
gsap.from('.cta-content', {
    scale: 0.9, opacity: 0, duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.cta-section',
        start: 'top 75%',
        toggleActions: 'play none none none',
    }
});

// ── Integration cards ──
gsap.utils.toArray('.int-card').forEach((card, i) => {
    gsap.from(card, {
        x: i % 2 === 0 ? -50 : 50,
        opacity: 0, duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: card,
            start: 'top 88%',
            toggleActions: 'play none none none',
        }
    });
});

// ── Tree Hierarchy Reveal ──
gsap.from('.tree-code', {
    opacity: 0, y: 40, duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
        trigger: '.tree-code',
        start: 'top 85%',
        toggleActions: 'play none none none',
    }
});

// ── Marquee pause on hover ──
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => {
        marqueeTrack.style.animationPlayState = 'paused';
    });
    marqueeTrack.addEventListener('mouseleave', () => {
        marqueeTrack.style.animationPlayState = 'running';
    });
}

// ── Smooth scroll to anchors ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) lenis.scrollTo(target, { offset: -70 });
    });
});

console.log('🇮🇳 Sushasan — Collective Intelligence for Good Governance');
