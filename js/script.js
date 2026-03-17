document.addEventListener('DOMContentLoaded', () => {
  initTilt();
  initScrollAnimations();
  if (document.getElementById('partsContainer')) {
    initPartSelection();
    filterParts('gpu');
  }
  if (document.getElementById('orderForm')) {
    initOrderForm();
  }
});

function initTilt() {
  const tiltCards = document.querySelectorAll('.tilt-card');
  if (typeof VanillaTilt !== 'undefined' && tiltCards.length) {
    VanillaTilt.init(tiltCards, {
      max: 8,
      speed: 400,
      glare: true,
      'max-glare': 0.15,
      scale: 1.02
    });
  }
}

function initScrollAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  gsap.from('.hero-title', {
    opacity: 0,
    y: 40,
    duration: 1,
    ease: 'power3.out'
  });

  gsap.from('.hero-subtitle', {
    opacity: 0,
    y: 20,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out'
  });

  gsap.from('.hero-cta', {
    opacity: 0,
    y: 16,
    duration: 0.6,
    delay: 0.5,
    ease: 'power3.out'
  });

  gsap.from('.advantage-card', {
    scrollTrigger: {
      trigger: '#advantages',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 50,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out'
  });

  gsap.from('.build-card', {
    scrollTrigger: {
      trigger: '.popular-builds',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 30,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out'
  });

  gsap.from('.configurator-cta', {
    scrollTrigger: {
      trigger: '.configurator-cta',
      start: 'top 80%',
      toggleActions: 'play none none reverse'
    },
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: 'power2.out'
  });
}

let selectedParts = {};
const totalBar = document.getElementById('totalBar');
const totalValue = document.getElementById('totalValue');

function initPartSelection() {
  const partCards = document.querySelectorAll('.part-card');
  const categoryBtns = document.querySelectorAll('.config-categories .list-group-item');

  partCards.forEach(card => {
    const btn = card.querySelector('.btn-select');
    const price = parseInt(card.dataset.price, 10);
    const partType = card.dataset.part;

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePart(card, partType, price);
      });
    }

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-select')) return;
      togglePart(card, partType, price);
    });
  });

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterParts(btn.dataset.category);
    });
  });
}

function togglePart(card, partType, price) {
  const wasSelected = card.classList.contains('selected');
  const allInCategory = document.querySelectorAll(`.part-card[data-part="${partType}"]`);

  allInCategory.forEach(c => c.classList.remove('selected'));
  if (!wasSelected) {
    card.classList.add('selected');
    selectedParts[partType] = { price };
  } else {
    delete selectedParts[partType];
  }

  updateTotal();
}

function filterParts(category) {
  const parts = document.querySelectorAll('.part-card');
  parts.forEach(part => {
    part.style.display = part.dataset.part === category ? '' : 'none';
  });
}

function updateTotal() {
  if (!totalValue) return;
  let sum = 0;
  Object.values(selectedParts).forEach(p => sum += p.price);

  totalValue.textContent = sum.toLocaleString('ru-RU') + ' ₽';

  if (totalBar) {
    totalBar.classList.add('updated');
    setTimeout(() => totalBar.classList.remove('updated'), 400);
  }
}

function initOrderForm() {
  const form = document.getElementById('orderForm');
  const successToast = document.getElementById('successToast');

  if (form && successToast) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const toast = new bootstrap.Toast(successToast);
      toast.show();

      form.reset();
    });
  }
}
