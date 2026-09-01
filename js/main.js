/* =========================================
   Nava Bharatha Yuva Chaitanya Samiti
   Main JavaScript
========================================= */

'use strict';

// ── Page Loader ──────────────────────────
window.addEventListener('load', () => {
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hide');
      setTimeout(() => loader.remove(), 600);
    }, 800);
  }
});

// ── Navbar ───────────────────────────────
const navbar     = document.getElementById('navbar');
const hamburger  = document.querySelector('.hamburger');
const navLinks   = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
});

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  // Close on link click (mobile)
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// Active nav link
(function setActiveNavLink() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── Vivekananda Quotes Rotator ───────────
const quotes = [
  { text: "Arise, Awake, and Stop Not till the Goal is Reached." },
  { text: "Take risks in your life. If you win, you can lead; if you lose, you can guide." },
  { text: "You have to grow from the inside out. None can teach you, none can make you spiritual. There is no other teacher but your own soul." },
  { text: "In a day, when you don't come across any problems — you can be sure that you are travelling in a wrong path." },
  { text: "All the powers in the universe are already ours. It is we who have put our hands before our eyes and cry that it is dark." },
  { text: "Stand up, be bold, be strong. Take the whole responsibility on your own shoulders, and know that you are the creator of your own destiny." },
  { text: "The greatest sin is to think yourself weak." },
  { text: "Strength is Life, Weakness is Death. Expansion is Life, Contraction is Death. Love is Life, Hatred is Death." },
  { text: "Serve man as God. That is the only religion." },
  { text: "Fill the brain with high thoughts, highest ideals, place them day and night before you, and out of that will come great work." },
];

(function initQuoteRotator() {
  const textEl = document.getElementById('quote-text');
  const dotsEl = document.getElementById('quote-dots');
  const prevBtn = document.getElementById('quotePrev');
  const nextBtn = document.getElementById('quoteNext');
  const container = document.querySelector('.quote-container');
  if (!textEl || !dotsEl) return;

  let current = 0;
  let interval;

  // Build dots
  quotes.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'quote-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => { goTo(i); resetInterval(); });
    dotsEl.appendChild(dot);
  });

  function goTo(index) {
    current = (index + quotes.length) % quotes.length;
    textEl.classList.add('fade');
    setTimeout(() => {
      textEl.textContent = `"${quotes[current].text}"`;
      textEl.classList.remove('fade');
    }, 250);
    document.querySelectorAll('.quote-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetInterval(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetInterval(); });

  if (container) {
    container.addEventListener('mouseenter', () => clearInterval(interval));
    container.addEventListener('mouseleave', () => resetInterval());
  }

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(next, 5000);
  }

  goTo(0);
  resetInterval();
})();

// ── Scroll Reveal ────────────────────────
(function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();

// ── Counter Animation ─────────────────────
(function initCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const step   = target / (duration / 16);
        let count    = 0;

        const timer = setInterval(() => {
          count += step;
          if (count >= target) {
            count = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(count).toLocaleString('en-IN') + suffix;
        }, 16);

        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
})();

// ── Gallery Filter ────────────────────────
(function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.gallery-item[data-cat]');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      items.forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });
})();

// ── Contact Form ──────────────────────────
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.btn');
    const origText = btn.textContent;
    btn.textContent = '✓ Message Sent!';
    btn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    btn.disabled = true;
    form.reset();
    setTimeout(() => {
      btn.textContent = origText;
      btn.style.background = '';
      btn.disabled = false;
    }, 4000);
  });
})();

// ── Smooth scroll for anchor links ───────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
