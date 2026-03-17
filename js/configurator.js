let componentsDB = null;
let selectedParts = {};
let activeCategory = 'gpu';
const maxTotal = 600000;
let configFilter = { cpu: null, gpu: null, cooling: null };

const categoryToKeys = {
  case: ['case'],
  cpu: ['cpu'],
  mb: ['motherboard'],
  gpu: ['gpu'],
  ram: ['ram'],
  cooling: ['air_cooling', 'water_cooling'],
  storage: ['m2ssd', 'hdd'],
  psu: ['psu']
};

async function loadComponents() {
  try {
    const r = await fetch('data/components.json');
    componentsDB = await r.json();
    return true;
  } catch (e) {
    console.error('Не удалось загрузить components.json', e);
    return false;
  }
}

function getPartsForCategory(category) {
  if (!componentsDB) return [];
  const keys = categoryToKeys[category];
  if (!keys) return [];
  let list = [];
  keys.forEach(k => {
    const arr = componentsDB[k];
    if (Array.isArray(arr)) list = list.concat(arr.map(item => ({ ...item, _sourceKey: k })));
  });
  return list;
}

function getFilteredMotherboards() {
  const list = getPartsForCategory('mb');
  const cpu = selectedParts.cpu?.data;
  if (!cpu || !cpu.socket) return list;
  return list.filter(mb => mb.socket === cpu.socket);
}

function getFilteredCooling() {
  const cpu = selectedParts.cpu?.data;
  let air = getPartsForCategory('cooling').filter(p => p._sourceKey === 'air_cooling');
  let water = getPartsForCategory('cooling').filter(p => p._sourceKey === 'water_cooling');
  if (configFilter.cooling === 'air') return air;
  if (configFilter.cooling === 'water') return water;
  if (cpu?.hot) return [...water, ...air];
  return [...air, ...water];
}

function getFilteredParts(category) {
  let list;
  if (category === 'mb') list = getFilteredMotherboards();
  else if (category === 'cooling') list = getFilteredCooling();
  else list = getPartsForCategory(category);

  if (category === 'cpu' && configFilter.cpu) {
    const q = configFilter.cpu === 'intel' ? 'Intel' : 'AMD';
    list = list.filter(p => (p.name || '').toLowerCase().includes(q.toLowerCase()));
  }
  if (category === 'gpu' && configFilter.gpu) {
    if (configFilter.gpu === 'nvidia') list = list.filter(p => (p.name || '').includes('RTX'));
    else if (configFilter.gpu === 'amd') list = list.filter(p => (p.name || '').includes('RX'));
  }
  return list;
}

function getRecommendations() {
  const cpu = selectedParts.cpu?.data;
  if (!cpu) return [];
  const tips = [];
  if (cpu.hot) {
    tips.push({ type: 'water', text: 'Рекомендуем водяное охлаждение для стабильной работы под нагрузкой.' });
  }
  if (cpu.isAmd) {
    tips.push({ type: 'amd', text: 'AMD лучше раскрывается на высоких частотах — рекомендуем эффективное охлаждение.' });
  }
  return tips;
}

function renderPrefilter(category) {
  const block = document.getElementById('configPrefilter');
  if (!block) return;
  const needCpu = category === 'cpu' && configFilter.cpu == null;
  const needGpu = category === 'gpu' && configFilter.gpu == null;
  const needCooling = category === 'cooling' && configFilter.cooling == null;
  if (!needCpu && !needGpu && !needCooling) {
    block.classList.add('d-none');
    block.innerHTML = '';
    return;
  }
  block.classList.remove('d-none');
  if (needCpu) {
    block.innerHTML = `
      <span class="text-muted small me-2">Производитель:</span>
      <button type="button" class="config-prefilter-btn" data-filter="cpu" data-value="intel">Intel</button>
      <button type="button" class="config-prefilter-btn" data-filter="cpu" data-value="amd">AMD</button>
    `;
  } else if (needGpu) {
    block.innerHTML = `
      <span class="text-muted small me-2">Производитель:</span>
      <button type="button" class="config-prefilter-btn" data-filter="gpu" data-value="nvidia">NVIDIA</button>
      <button type="button" class="config-prefilter-btn" data-filter="gpu" data-value="amd">AMD</button>
    `;
  } else if (needCooling) {
    block.innerHTML = `
      <span class="text-muted small me-2">Тип:</span>
      <button type="button" class="config-prefilter-btn" data-filter="cooling" data-value="air">Воздушное</button>
      <button type="button" class="config-prefilter-btn" data-filter="cooling" data-value="water">Водяное</button>
    `;
  }
  block.querySelectorAll('.config-prefilter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      configFilter[btn.dataset.filter] = btn.dataset.value;
      block.querySelectorAll('.config-prefilter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(activeCategory);
    });
  });
}

function updateCenterVisual() {
  const sel = selectedParts[activeCategory];
  const imgEl = document.getElementById('configSelectedImg');
  const placeholderEl = document.querySelector('.config-selected-placeholder');
  const nameEl = document.getElementById('configSelectedName');
  const tipEl = document.getElementById('configSelectedTip');
  if (!imgEl || !nameEl) return;

  const recommendations = getRecommendations();
  const showTip = activeCategory === 'cooling' && recommendations.length > 0;
  if (tipEl) {
    if (showTip) {
      tipEl.innerHTML = recommendations.map(r => r.text).join(' ');
      tipEl.classList.remove('d-none');
    } else {
      tipEl.classList.add('d-none');
      tipEl.innerHTML = '';
    }
  }

  if (sel?.data?.image) {
    imgEl.src = sel.data.image;
    imgEl.alt = sel.name;
    imgEl.classList.remove('d-none');
    if (placeholderEl) placeholderEl.classList.add('d-none');
  } else {
    imgEl.classList.add('d-none');
    imgEl.removeAttribute('src');
    if (placeholderEl) placeholderEl.classList.remove('d-none');
  }
  nameEl.textContent = sel?.name || '';
}

function renderGallery(category) {
  const container = document.getElementById('partsContainer');
  const recBlock = document.getElementById('configRecommendations');
  if (!container) return;

  renderPrefilter(category);

  const parts = getFilteredParts(category);
  const selected = selectedParts[category];

  const recommendations = getRecommendations();
  if (recBlock) {
    if (recommendations.length && category === 'cpu' && activeCategory === 'cpu') {
      recBlock.innerHTML = recommendations.map(r => `
        <div class="config-tip config-tip-${r.type}">
          <span class="config-tip-icon">${r.type === 'water' ? '◆' : '◇'}</span>
          <span>${r.text}</span>
        </div>
      `).join('');
      recBlock.classList.remove('d-none');
    } else if (category !== 'cooling') {
      recBlock.innerHTML = recommendations.length && category === 'cooling' ? '' : '';
      recBlock.classList.add('d-none');
    } else {
      recBlock.classList.add('d-none');
    }
  }

  if (category === 'mb' && !selectedParts.cpu) {
    container.innerHTML = '<p class="config-empty-hint text-muted small">Сначала выберите процессор — список плат подстроится под сокет.</p>';
    updateCenterVisual();
    return;
  }
  if (category === 'mb' && parts.length === 0) {
    container.innerHTML = '<p class="config-empty-hint text-muted small">Нет материнских плат для выбранного сокета.</p>';
    updateCenterVisual();
    return;
  }

  if ((category === 'cpu' && configFilter.cpu == null) || (category === 'gpu' && configFilter.gpu == null) || (category === 'cooling' && configFilter.cooling == null)) {
    container.innerHTML = '<p class="config-empty-hint text-muted small">Выберите вариант выше, чтобы увидеть список.</p>';
    updateCenterVisual();
    return;
  }

  container.innerHTML = parts.map(p => {
    const isSelected = selected?.id === p.id || selected?.name === p.name;
    const imgHtml = p.image
      ? `<div class="part-card-photo"><img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('placeholder')"></div>`
      : '';
    return `
      <div class="config-part-card part-card ${isSelected ? 'selected' : ''}"
           data-category="${category}"
           data-id="${(p.id || '').replace(/"/g, '&quot;')}"
           data-name="${(p.name || '').replace(/"/g, '&quot;')}"
           data-price="${p.price}">
        ${imgHtml}
        <div class="part-card-inner">
          <h5 class="part-name">${p.name}</h5>
          ${p.socket ? `<p class="part-specs">${p.socket}</p>` : ''}
          <p class="part-price">${p.price.toLocaleString('ru-RU')} ₽</p>
          <button class="btn btn-select">Выбрать</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.part-card').forEach(card => {
    card.querySelector('.btn-select')?.addEventListener('click', () => selectPart(card));
  });
  updateCenterVisual();
}

function selectPart(card) {
  const category = card.dataset.category;
  const id = card.dataset.id;
  const name = card.dataset.name;
  const price = parseInt(card.dataset.price, 10);
  const parts = getFilteredParts(category);
  const data = parts.find(p => (p.id && p.id === id) || p.name === name) || { name, price };

  selectedParts[category] = { id: data.id, name: data.name, price: data.price, data };
  document.querySelectorAll(`.part-card[data-category="${category}"]`).forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  if (category === 'cpu') {
    renderGallery('mb');
    renderGallery('cooling');
  }
  updateTotal();
  updateCenterVisual();
}

function setActiveStep(category) {
  activeCategory = category;
  document.querySelectorAll('.config-step').forEach(s => {
    s.classList.toggle('active', s.dataset.category === category);
    const label = s.querySelector('.step-active');
    if (label) label.style.display = s.dataset.category === category ? 'inline' : 'none';
  });
  renderGallery(category);
  updateCenterVisual();
}

function updateTotal() {
  let sum = 0;
  Object.values(selectedParts).forEach(p => sum += p.price);

  const totalVal = sum.toLocaleString('ru-RU') + ' ₽';
  const leftEl = document.getElementById('totalValueLeft');
  const rightEl = document.getElementById('totalValueRight');
  if (leftEl) leftEl.textContent = totalVal;
  if (rightEl) rightEl.textContent = totalVal;

  const progress = Math.min(100, (sum / maxTotal) * 100);
  const bar = document.getElementById('progressBar');
  if (bar) bar.style.width = progress + '%';
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await loadComponents();
  if (!ok) {
    document.getElementById('partsContainer').innerHTML = '<p class="text-muted">Не удалось загрузить каталог комплектующих.</p>';
    return;
  }

  document.querySelectorAll('.config-step').forEach(step => {
    step.addEventListener('click', () => setActiveStep(step.dataset.category));
  });

  setActiveStep('gpu');
  updateTotal();

  document.getElementById('orderForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
    e.target.reset();
  });
});
