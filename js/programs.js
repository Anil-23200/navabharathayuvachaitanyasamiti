/* =========================================
   Programs Page JavaScript
   - Program section tabs
   - Program auto-moving media carousels (Photos & Videos)
   - Lightbox modal viewer (Supports real img/video & fallbacks)
========================================= */

'use strict';

// ── State for Program Carousels ────────────
const carouselStates = {};
let lbCurrentItems = [];
let lbCurrentIdx = 0;

// ── Initialize Program Tabs ───────────────
(function initTabs() {
  const tabs     = document.querySelectorAll('.prog-tab');
  const sections = document.querySelectorAll('.prog-section');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      const target   = document.getElementById(targetId);
      if (!target) return;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Smooth scroll to section (offset for sticky tabs bar)
      const offset = 130;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Highlight tab on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tabs.forEach(t => {
          t.classList.toggle('active', t.dataset.target === id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-130px 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));
})();

// ── Initialize Program Carousels ───────────
(function initProgramCarousels() {
  const carousels = document.querySelectorAll('.prog-slider-container[data-program]');
  
  carousels.forEach(container => {
    const progId = container.dataset.program;
    const track  = container.querySelector('.prog-slider-track');
    const slides = container.querySelectorAll('.prog-slide-item');
    const prevBtn = container.querySelector('.prog-slider-btn.prev');
    const nextBtn = container.querySelector('.prog-slider-btn.next');
    const dotsWrap = document.getElementById(`dots-${progId}`);

    if (!track || !slides.length) return;

    carouselStates[progId] = {
      currentIndex: 0,
      total: slides.length,
      track: track,
      timer: null
    };

    // Create dots if wrap exists
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'prog-slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(progId, i));
        dotsWrap.appendChild(dot);
      });
    }

    // Prev / Next button click handlers
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveSlide(progId, -1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveSlide(progId, 1);
      });
    }

    // Auto-advance slider every 4 seconds
    startAutoSlide(progId);

    // Pause on hover
    container.addEventListener('mouseenter', () => stopAutoSlide(progId));
    container.addEventListener('mouseleave', () => startAutoSlide(progId));

    // Touch / swipe support
    let touchStartX = 0;
    container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) {
        if (dx < 0) moveSlide(progId, 1);
        else moveSlide(progId, -1);
      }
    });

    // Slide item click -> Open Lightbox
    slides.forEach((slide, idx) => {
      slide.addEventListener('click', () => {
        openProgramLightbox(progId, idx);
      });
    });
  });
})();

function goToSlide(progId, index) {
  const state = carouselStates[progId];
  if (!state) return;

  state.currentIndex = (index + state.total) % state.total;
  state.track.style.transform = `translateX(-${state.currentIndex * 100}%)`;

  // Update dots
  const dotsWrap = document.getElementById(`dots-${progId}`);
  if (dotsWrap) {
    const dots = dotsWrap.querySelectorAll('.prog-slider-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === state.currentIndex));
  }

  resetAutoSlide(progId);
}

function moveSlide(progId, direction) {
  const state = carouselStates[progId];
  if (!state) return;
  goToSlide(progId, state.currentIndex + direction);
}

function startAutoSlide(progId) {
  const state = carouselStates[progId];
  if (!state || state.timer) return;
  state.timer = setInterval(() => {
    moveSlide(progId, 1);
  }, 4000);
}

function stopAutoSlide(progId) {
  const state = carouselStates[progId];
  if (!state || !state.timer) return;
  clearInterval(state.timer);
  state.timer = null;
}

function resetAutoSlide(progId) {
  stopAutoSlide(progId);
  startAutoSlide(progId);
}

// ── Lightbox Modal for Media Viewing ────────
function openProgramLightbox(progId, slideIndex) {
  const container = document.querySelector(`.prog-slider-container[data-program="${progId}"]`);
  if (!container) return;

  const slides = container.querySelectorAll('.prog-slide-item');
  lbCurrentItems = Array.from(slides).map(slide => {
    const title     = slide.querySelector('h4')?.textContent || '';
    const desc      = slide.querySelector('p')?.textContent || '';
    const badge     = slide.querySelector('.media-type-badge')?.textContent || '';
    const isVideo   = badge.includes('VIDEO') || slide.dataset.type === 'video';
    const mediaBg   = slide.querySelector('.prog-slide-media');
    
    // Check if developer added real <img> or <video> elements
    const realImg   = slide.querySelector('img')?.getAttribute('src');
    const realVideo = slide.querySelector('video')?.getAttribute('src') || slide.dataset.video;

    return {
      title,
      desc,
      isVideo,
      realImg,
      realVideo,
      bgStyle: mediaBg ? mediaBg.getAttribute('style') : '',
      icon: mediaBg ? mediaBg.textContent.trim().replace(/▶|📷|🎥/g, '') : '📸'
    };
  });

  lbCurrentIdx = slideIndex;
  renderLightboxItem();
  
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function renderLightboxItem() {
  const item = lbCurrentItems[lbCurrentIdx];
  if (!item) return;

  const lbMediaWrap = document.getElementById('lb-media-wrap');
  const lbCaption   = document.getElementById('lb-caption');

  if (lbMediaWrap) {
    if (item.isVideo && item.realVideo) {
      lbMediaWrap.innerHTML = `
        <video controls autoplay style="max-width:90vw; max-height:75vh; border-radius:12px;">
          <source src="${item.realVideo}" type="video/mp4">
          Your browser does not support video playback.
        </video>`;
    } else if (item.realImg) {
      lbMediaWrap.innerHTML = `
        <img src="${item.realImg}" alt="${item.title}" style="max-width:90vw; max-height:75vh; border-radius:12px; object-fit:contain;" />`;
    } else {
      lbMediaWrap.innerHTML = `
        <div style="${item.bgStyle}; width:85vw; max-width:650px; height:380px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:8rem; color:#fff; box-shadow:0 8px 40px rgba(0,0,0,0.5);">
          ${item.icon}
        </div>`;
    }
  }

  if (lbCaption) {
    lbCaption.innerHTML = `
      <strong style="color:#FFD700; font-size:1.1rem; display:block; margin-bottom:0.2rem;">${item.title}</strong>
      <span>${item.desc}</span> 
      <span style="opacity:0.6; font-size:0.8rem; display:block; margin-top:0.4rem;">(${lbCurrentIdx + 1} of ${lbCurrentItems.length})</span>
    `;
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

function lbNav(dir) {
  if (!lbCurrentItems.length) return;
  lbCurrentIdx = (lbCurrentIdx + dir + lbCurrentItems.length) % lbCurrentItems.length;
  renderLightboxItem();
}

// Global window bindings for inline HTML handlers
window.closeLightbox = closeLightbox;
window.lbNav         = lbNav;

// Keyboard controls
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  lbNav(1);
  if (e.key === 'ArrowLeft')   lbNav(-1);
});
