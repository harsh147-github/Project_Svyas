// ── Initialization ──
window.addEventListener('load', () => {
    // Check if dependencies are loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not found. Animations disabled.');
        const preloader = document.querySelector('.preloader');
        if (preloader) preloader.style.display = 'none';
        return;
    }

    // Initialize Lenis
    let lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Connect Lenis to ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
    }

    // Hide preloader
    gsap.to('.preloader', {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            const preloader = document.querySelector('.preloader');
            if (preloader) preloader.style.display = 'none';
            initHero();
            initScrollReveals();
        }
    });

    // Smooth Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target && lenis) {
                lenis.scrollTo(target);
            } else if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// ── Animations ──

function initHero() {
    const tl = gsap.timeline();
    
    tl.from('.hero-title', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.1
    })
    .from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, '-=0.8')
    .from('.btn-premium', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
    }, '-=0.6');

    // Hero Background Animation
    gsap.to('.hero-glow', {
        scale: 1.2,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
}

function initScrollReveals() {
    // Reveal Panels
    document.querySelectorAll('.reveal-panel').forEach(panel => {
        gsap.from(panel, {
            scrollTrigger: {
                trigger: panel,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        });
    });

    // Reveal Text
    document.querySelectorAll('.reveal-text').forEach(text => {
        gsap.from(text, {
            scrollTrigger: {
                trigger: text,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out'
        });
    });

    // Glass Panel Hover
    document.querySelectorAll('.glass-panel').forEach(panel => {
        panel.addEventListener('mouseenter', () => {
            gsap.to(panel, {
                y: -10,
                borderColor: 'rgba(212, 163, 115, 0.4)',
                duration: 0.4,
                ease: 'power2.out'
            });
        });
        panel.addEventListener('mouseleave', () => {
            gsap.to(panel, {
                y: 0,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                duration: 0.4,
                ease: 'power2.out'
            });
        });
    });
}

console.log('🇮🇳 Sushasan — Ultra Premium Experience Initialized');
