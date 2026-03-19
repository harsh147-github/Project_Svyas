/* ═══════════════════════════════════════════════════
   SUSHASAN — Vibe Coding Engine
   Lenis Smooth Scroll + GSAP ScrollTrigger + Custom Cursor
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

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

// ── Vibe Cursor ──
const cursor = document.querySelector('.vibe-cursor');
const follower = document.querySelector('.vibe-follower');
if (cursor && follower && !window.matchMedia("(pointer: coarse)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // QuickTo for buttery smooth cursor logic
    const xSetC = gsap.quickTo(cursor, "x", {duration: 0.1, ease: "power3"});
    const ySetC = gsap.quickTo(cursor, "y", {duration: 0.1, ease: "power3"});
    const xSetF = gsap.quickTo(follower, "x", {duration: 0.5, ease: "power3.out"});
    const ySetF = gsap.quickTo(follower, "y", {duration: 0.5, ease: "power3.out"});

    window.addEventListener("mousemove", e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        xSetC(mouseX); ySetC(mouseY);
        xSetF(mouseX); ySetF(mouseY);
    });

    // Hover states for links and buttons
    const hoverables = document.querySelectorAll('a, button, .card, .pipeline-job, .btn-primary, .btn-ghost');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('active');
            follower.classList.add('active');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('active');
            follower.classList.remove('active');
            // Reset magnetic transform
            gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
        });
    });

    // Magnetic Buttons
    const magnetics = document.querySelectorAll('.btn-primary, .btn-ghost, .nav-logo');
    magnetics.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;
            
            // Calculate movement (max 15px)
            const moveX = (relX - rect.width / 2) / rect.width * 30;
            const moveY = (relY - rect.height / 2) / rect.height * 30;
            
            gsap.to(btn, {
                x: moveX,
                y: moveY,
                duration: 0.4,
                ease: "power2.out"
            });
        });
    });
}

// ── Spotlight Hover Effect on Cards ──
const spotlightCards = document.querySelectorAll('.card, .pipeline-job');
spotlightCards.forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// ── Preloader ──
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    gsap.to(preloader, {
        opacity: 0, duration: 0.8, delay: 0.4, ease: 'power2.inOut',
        onComplete: () => {
            preloader.classList.add('done');
            animateHero();
        }
    });
});

// ── Hero Sweep Animations ──
function animateHero() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    tl.to('.hero h1 .word-inner', {
        y: 0, opacity: 1, duration: 1.4, stagger: 0.06,
    })
    .to('.hero-subtitle', {
        y: 0, opacity: 1, duration: 1.2,
    }, '-=1.0')
    .to('.hero-desc', {
        y: 0, opacity: 1, duration: 1,
    }, '-=0.9')
    .to('.hero-badges', {
        y: 0, opacity: 1, duration: 0.9,
    }, '-=0.8')
    .to('.hero-scroll', {
        opacity: 1, duration: 0.6,
    }, '-=0.6');
}

// ── Reveal Animations ──
gsap.utils.toArray('.section-label, .section-heading, .section-desc').forEach(el => {
    gsap.from(el, {
        y: 60, opacity: 0, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
    });
});

gsap.utils.toArray('.grid, .dual-box, .flow-steps, .pipeline-grid, .tech-grid').forEach(grid => {
    const children = grid.children;
    gsap.from(children, {
        y: 60, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 82%', toggleActions: 'play none none none' }
    });
});

gsap.utils.toArray('.big-quote').forEach(q => {
    gsap.from(q, {
        y: 50, opacity: 0, duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: q, start: 'top 85%', toggleActions: 'play none none none' }
    });
});

gsap.utils.toArray('.stat-num[data-count]').forEach(el => {
    const target = el.getAttribute('data-count');
    const suffix = el.getAttribute('data-suffix') || '';
    const isFloat = target.includes('.');
    ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
            const obj = { val: 0 };
            gsap.to(obj, {
                val: parseFloat(target), duration: 2.2, ease: 'power2.out',
                onUpdate: () => el.textContent = (isFloat ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix
            });
        }
    });
});

gsap.utils.toArray('.bar-fill').forEach(bar => {
    const w = bar.getAttribute('data-width');
    ScrollTrigger.create({
        trigger: bar, start: 'top 90%', once: true,
        onEnter: () => gsap.to(bar, { width: w, duration: 1.8, ease: 'power3.out' })
    });
});

gsap.utils.toArray('.parallax-img-wrap img').forEach(img => {
    gsap.to(img, {
        yPercent: -20, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });
});

gsap.utils.toArray('.section-divider').forEach(div => {
    gsap.from(div, {
        width: 0, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: div, start: 'top 90%', toggleActions: 'play none none none' }
    });
});

// ── Hero Parallax ──
gsap.to('.hero-content', {
    yPercent: 40, opacity: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
});

// ── Infinite Marquee Hover Pause ──
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
    marqueeTrack.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
    marqueeTrack.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
}

// ── Smooth scroll to anchors ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) lenis.scrollTo(target, { offset: -70 });
    });
});

// ── Hero Floating Mesh Orbs ──
(function () {
    const c = document.getElementById('heroCanvas');
    if (!c) return;
    const ctx = c.getContext('2d');
    let W, H;
    function resize() { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; }
    resize(); window.addEventListener('resize', resize);

    const nodes = [];
    const N = 40;
    // Saffron, Blue, Green, White - Premium Vibe colors
    const colors = ['rgba(255,153,51,', 'rgba(19,136,8,', 'rgba(37,99,235,', 'rgba(255,255,255,'];

    for (let i = 0; i < N; i++) {
        nodes.push({
            x: Math.random() * 2000, y: Math.random() * 1200,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2.5 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 180) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 * (1 - d / 180)) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        for (const n of nodes) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
            ctx.fillStyle = n.color + '0.6)';
            ctx.fill();
            
            // Soft glow
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
            ctx.fillStyle = n.color + '0.05)';
            ctx.fill();

            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > W) n.vx *= -1;
            if (n.y < 0 || n.y > H) n.vy *= -1;
        }
        requestAnimationFrame(draw);
    }
    draw();
})();
