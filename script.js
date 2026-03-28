// ===========================
// Theme (Light Default)
// ===========================
const html = document.documentElement;
const themeSwitch = document.getElementById('themeSwitch');

function initTheme() {
    const saved = localStorage.getItem('andika-run-theme') || 'dark';
    html.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
}

function updateThemeIcon(theme) {
    themeSwitch.innerHTML = theme === 'dark' ? '<span class="theme-icon">🌙</span>' : '<span class="theme-icon">☀️</span>';
}

initTheme();

themeSwitch.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.classList.add('theme-transition');
    html.setAttribute('data-theme', next);
    localStorage.setItem('andika-run-theme', next);
    updateThemeIcon(next);
    setTimeout(() => html.classList.remove('theme-transition'), 500);
});

// ===========================
// Header Scroll
// ===========================
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
});

// ===========================
// Mobile Menu
// ===========================
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');

menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// ===========================
// Smooth Scroll
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const y = target.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    });
});

// ===========================
// Scroll Reveal
// ===========================
const revealElements = document.querySelectorAll('[data-reveal]');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// ===========================
// Animate Stats
// ===========================
let statsAnimated = false;
const statElements = document.querySelectorAll('.hs-val');

function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;
    statElements.forEach(el => {
        const text = el.textContent;
        const target = parseInt(text.replace(/,/g, ''));
        if (isNaN(target)) return;
        const duration = 2000;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    });
}

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    const obs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { animateStats(); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(heroStats);
}

// ===========================
// Parallax on Hero
// ===========================
const heroVisual = document.querySelector('.hero-visual-3d');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    if (scrolled < window.innerHeight && heroVisual) {
        heroVisual.style.transform = `translateY(${scrolled * 0.05}px)`;
    }
});

// ===========================
// Gallery Filter
// ===========================
const galleryTabs = document.querySelectorAll('.gallery-tab');
const galleryItems = document.querySelectorAll('.gallery-item');

galleryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const filter = tab.getAttribute('data-filter');

        galleryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        galleryItems.forEach(item => {
            const category = item.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                item.classList.remove('hidden');
                item.classList.add('revealed');
            } else {
                item.classList.add('hidden');
            }
        });
    });
});
