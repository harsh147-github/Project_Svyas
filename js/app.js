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
            document.querySelector('.preloader').style.display = 'none';
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

console.log('🇮🇳 Sushasan — Ultra Premium Experience Initialized');
