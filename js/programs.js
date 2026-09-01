/* =========================================
   Programs Page JavaScript
   - Photo upload & preview
   - Drag & drop
   - Tab navigation
   - Lightbox viewer
========================================= */

'use strict';

// ── State ─────────────────────────────────
const programPhotos = {};  // { programId: [ { src, name } ] }
let lbImages = [];
let lbIndex  = 0;

// ── Program Tabs ──────────────────────────
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

// ── Photo Upload Setup ────────────────────
(function initAllUploads() {
  const zones = document.querySelectorAll('.upload-zone[data-program]');
  zones.forEach(zone => {
    const programId = zone.dataset.program;
    programPhotos[programId] = [];
    setupUploadZone(zone, programId);
  });
})();

function setupUploadZone(zone, programId) {
  const fileInput = zone.querySelector('.file-input');

  // Click to upload (already handled by file input overlay)
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files, programId);
    e.target.value = ''; // reset so same file can be re-added
  });

  // Drag & Drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files, programId);
  });
}

function handleFiles(files, programId) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  Array.from(files).forEach(file => {
    if (!allowed.includes(file.type)) {
      showToast(`⚠️ "${file.name}" is not a supported image format.`, 'warn');
      return;
    }
    if (file.size > maxSize) {
      showToast(`⚠️ "${file.name}" exceeds 10MB limit.`, 'warn');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgData = { src: e.target.result, name: file.name };
      programPhotos[programId].push(imgData);
      renderPreview(programId);
    };
    reader.readAsDataURL(file);
  });
}

function renderPreview(programId) {
  const grid    = document.getElementById(`preview-${programId}`);
  const actions = document.getElementById(`actions-${programId}`);
  const count   = document.getElementById(`count-${programId}`);
  if (!grid) return;

  const photos = programPhotos[programId];
  grid.innerHTML = '';

  photos.forEach((photo, index) => {
    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    thumb.innerHTML = `
      <img src="${photo.src}" alt="${photo.name}" loading="lazy" />
      <div class="thumb-overlay">🔍</div>
      <button class="thumb-remove" onclick="removePhoto('${programId}', ${index})" title="Remove">✕</button>
    `;
    thumb.addEventListener('click', (e) => {
      if (!e.target.classList.contains('thumb-remove')) {
        openLightbox(programId, index);
      }
    });
    grid.appendChild(thumb);
  });

  if (actions) actions.style.display = photos.length ? 'flex' : 'none';
  if (count)   count.textContent = `${photos.length} photo${photos.length !== 1 ? 's' : ''}`;
}

function removePhoto(programId, index) {
  programPhotos[programId].splice(index, 1);
  renderPreview(programId);
}

function clearPhotos(programId) {
  programPhotos[programId] = [];
  renderPreview(programId);
  showToast('✅ All photos cleared.', 'success');
}
window.clearPhotos = clearPhotos;

// ── Lightbox ──────────────────────────────
function openLightbox(programId, index) {
  lbImages = programPhotos[programId];
  lbIndex  = index;
  const lb    = document.getElementById('lightbox');
  const img   = document.getElementById('lb-img');
  const cap   = document.getElementById('lb-caption');
  if (!lb || !img) return;

  img.src = lbImages[index].src;
  if (cap) cap.textContent = `${lbImages[index].name}  (${index + 1} / ${lbImages.length})`;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

function lbNav(dir) {
  lbIndex = (lbIndex + dir + lbImages.length) % lbImages.length;
  const img = document.getElementById('lb-img');
  const cap = document.getElementById('lb-caption');
  if (img) img.src = lbImages[lbIndex].src;
  if (cap) cap.textContent = `${lbImages[lbIndex].name}  (${lbIndex + 1} / ${lbImages.length})`;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  const lb = document.getElementById('lightbox');
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  lbNav(1);
  if (e.key === 'ArrowLeft')   lbNav(-1);
});

window.closeLightbox = closeLightbox;
window.lbNav         = lbNav;
window.removePhoto   = removePhoto;

// ── Toast Notification ────────────────────
function showToast(message, type = 'info') {
  const existing = document.querySelector('.prog-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'prog-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${type === 'warn' ? '#E8751A' : type === 'success' ? '#27ae60' : '#1A1A2E'};
    color: #fff;
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-size: 0.9rem;
    font-family: 'Lato', sans-serif;
    font-weight: 700;
    z-index: 99999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
