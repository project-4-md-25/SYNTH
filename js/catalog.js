let allProducts = [];
let componentsDB = null;
let activeTab = 'all';
let selectedProductId = null;

const readyBuilds = [
  { id: 'b1', name: 'Gaming Pro', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 450000, specs: 'RTX 4090 + i9-14900K', ram: '32 GB DDR5', storage: '2 TB NVMe', cooling: 'AIO 360 RGB' },
  { id: 'b2', name: 'Gaming Elite', category: 'builds', cpu: 'amd', gpu: 'nvidia', price: 420000, specs: 'RTX 4090 + Ryzen 9 7950X', ram: '32 GB DDR5', storage: '2 TB NVMe', cooling: 'AIO 360' },
  { id: 'b3', name: 'Gaming', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 280000, specs: 'RTX 4080 + i7-14700K', ram: '32 GB DDR5', storage: '1 TB NVMe', cooling: 'AIO 240' },
  { id: 'b4', name: 'Gaming AMD', category: 'builds', cpu: 'amd', gpu: 'amd', price: 260000, specs: 'RX 7900 XTX + Ryzen 9 7950X', ram: '32 GB DDR5', storage: '1 TB NVMe', cooling: 'AIO 240' },
  { id: 'b5', name: 'Standard', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 180000, specs: 'RTX 4070 + i5-14600K', ram: '32 GB DDR5', storage: '1 TB NVMe', cooling: 'AIO 240' },
  { id: 'b6', name: 'Standard AMD', category: 'builds', cpu: 'amd', gpu: 'nvidia', price: 170000, specs: 'RTX 4070 + Ryzen 7 7800X3D', ram: '32 GB DDR5', storage: '1 TB NVMe', cooling: 'AIO 240' },
  { id: 'b7', name: 'Budget', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 120000, specs: 'RTX 4060 + i5-13400', ram: '16 GB DDR5', storage: '512 GB NVMe', cooling: 'Башня' },
  { id: 'b8', name: 'Creator', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 320000, specs: 'RTX 4080 + i9-14900K', ram: '64 GB DDR5', storage: '2 TB NVMe', cooling: 'AIO 360' },
  { id: 'b9', name: 'Creator AMD', category: 'builds', cpu: 'amd', gpu: 'nvidia', price: 310000, specs: 'RTX 4080 + Ryzen 9 7950X', ram: '64 GB DDR5', storage: '2 TB NVMe', cooling: 'AIO 360' },
  { id: 'b10', name: 'Compact', category: 'builds', cpu: 'intel', gpu: 'nvidia', price: 220000, specs: 'RTX 4070 + i7 Mini-ITX', ram: '32 GB DDR5', storage: '1 TB NVMe', cooling: 'Low-profile' },
];

const tabToLabel = {
  all: 'Все',
  cpu: 'Процессоры',
  motherboard: 'Материнские платы',
  gpu: 'Видеокарты',
  ram: 'Память',
  cooling: 'Охлаждение',
  storage: 'Накопители',
  builds: 'Готовые ПК'
};

function flattenComponents(db) {
  const out = [];
  const maps = [
    { key: 'cpu', category: 'cpu' },
    { key: 'motherboard', category: 'motherboard' },
    { key: 'gpu', category: 'gpu' },
    { key: 'ram', category: 'ram' },
    { key: 'air_cooling', category: 'cooling' },
    { key: 'water_cooling', category: 'cooling' },
    { key: 'm2ssd', category: 'storage' },
    { key: 'hdd', category: 'storage' },
  ];
  maps.forEach(({ key, category }) => {
    const arr = db[key];
    if (!Array.isArray(arr)) return;
    arr.forEach(item => {
      let image = item.image;
      if (typeof image === 'string' && image.endsWith('"')) image = image.slice(0, -1);
      const name = item.name || '';
      const ramCapacity = (category === 'ram' && name) ? parseRamCapacity(name) : null;
      const ramType = (category === 'ram' && name) ? parseRamType(name) : null;
      const storageCapacity = (category === 'storage' && name) ? parseStorageCapacity(name) : null;
      const isM2 = category === 'storage' && key === 'm2ssd';
      const coolingType = category === 'cooling' ? (key === 'water_cooling' ? 'water' : 'air') : null;
      out.push({
        ...item,
        image,
        category,
        specs: item.socket || item.name,
        id: item.id || key + '-' + (item.name || '').replace(/\s+/g, '-').toLowerCase(),
        ramCapacity,
        ramType,
        storageCapacity,
        isM2,
        coolingType,
        socket: item.socket || null
      });
    });
  });
  return out;
}

function parseRamCapacity(name) {
  const m = (name || '').match(/(\d+)\s*GB/i);
  return m ? parseInt(m[1], 10) : null;
}
function parseRamType(name) {
  return (name || '').match(/DDR5/i) ? 'DDR5' : ((name || '').match(/DDR4/i) ? 'DDR4' : null);
}
function parseStorageCapacity(name) {
  const m = (name || '').match(/(\d+)\s*(GB|TB)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return m[2].toUpperCase() === 'TB' ? n * 1024 : n;
}

async function loadCatalog() {
  try {
    const r = await fetch('data/components.json');
    componentsDB = await r.json();
    allProducts = flattenComponents(componentsDB).concat(readyBuilds);
    return true;
  } catch (e) {
    console.error('Не удалось загрузить каталог', e);
    allProducts = readyBuilds;
    return false;
  }
}

function getSearchSuggestions(query) {
  const q = (query || '').toLowerCase().trim();
  if (q.length < 2) return [];

  const suggestions = [];
  const seen = new Set();

  const addCategory = (label, tab, filterBrand) => {
    const key = 'cat-' + tab + (filterBrand || '');
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push({ type: 'category', label, tab, filterBrand });
  };

  if (/gtx|rtx|nvidia|видео/.test(q)) {
    addCategory('Видеокарты NVIDIA', 'gpu', 'nvidia');
  }
  if (/rx|radeon|amd.*видео|видео.*amd/.test(q) || (q.includes('amd') && /видео|gpu|граф/.test(q))) {
    addCategory('Видеокарты AMD', 'gpu', 'amd');
  }
  if (/intel|core\s*i|i3|i5|i7|i9|процессор.*intel/.test(q)) {
    addCategory('Процессоры Intel', 'cpu', 'intel');
  }
  if (/ryzen|amd\s*r|r5|r7|r9|процессор.*amd/.test(q)) {
    addCategory('Процессоры AMD', 'cpu', 'amd');
  }
  if (/материн|motherboard|плата|mb|b550|b650|z790/.test(q)) {
    suggestions.push({ type: 'category', label: 'Материнские платы', tab: 'motherboard' });
  }
  if (/память|ram|ddr4|ddr5|оператив/.test(q)) {
    suggestions.push({ type: 'category', label: 'Память', tab: 'ram' });
  }
  if (/охлажд|cooling|водян|радиатор|aio/.test(q)) {
    suggestions.push({ type: 'category', label: 'Охлаждение', tab: 'cooling' });
  }
  if (/ssd|nvme|m\.2|накопитель|hdd|жестк/.test(q)) {
    suggestions.push({ type: 'category', label: 'Накопители', tab: 'storage' });
  }
  if (/готовы|сборк|пк\s*под\s*ключ/.test(q)) {
    suggestions.push({ type: 'category', label: 'Готовые ПК', tab: 'builds' });
  }

  allProducts.forEach(p => {
    const name = (p.name || '').toLowerCase();
    if (!name.includes(q)) return;
    const label = p.name;
    if (seen.has('p-' + p.id)) return;
    seen.add('p-' + p.id);
    suggestions.push({ type: 'product', label, product: p });
  });

  return suggestions.slice(0, 12);
}

function showSuggestions(list) {
  const el = document.getElementById('searchSuggestions');
  if (!el) return;
  if (!list || list.length === 0) {
    el.classList.add('d-none');
    el.innerHTML = '';
    return;
  }
  const suggestionById = {};
  list.filter(s => s.type === 'product' && s.product).forEach(s => { suggestionById[(s.product.id || '').toString()] = s.product; });
  el._suggestionById = suggestionById;
  el.innerHTML = list.map((s) => {
    if (s.type === 'category') {
      return `<button type="button" class="suggestion-item" data-type="category" data-tab="${s.tab}" data-filter="${s.filterBrand || ''}">${s.label}</button>`;
    }
    const pid = (s.product?.id || '').toString().replace(/"/g, '&quot;');
    return `<button type="button" class="suggestion-item" data-type="product" data-id="${pid}">${s.label}</button>`;
  }).join('');
  el.classList.remove('d-none');
}

function hideSuggestions() {
  const el = document.getElementById('searchSuggestions');
  if (el) {
    el.classList.add('d-none');
    el.innerHTML = '';
  }
}

function applySuggestion(type, tab, filterBrand, product) {
  const searchInput = document.getElementById('searchInput');
  if (type === 'category') {
    selectedProductId = null;
    activeTab = tab;
    document.querySelectorAll('#catalogTabs .nav-link').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (filterBrand && tab === 'gpu') {
      document.querySelectorAll('.filter-gpu').forEach(cb => { cb.checked = (cb.value === filterBrand); });
    }
    if (filterBrand && tab === 'cpu') {
      document.querySelectorAll('.filter-cpu').forEach(cb => { cb.checked = (cb.value === filterBrand); });
    }
    if (searchInput) searchInput.value = '';
  } else if (type === 'product' && product) {
    selectedProductId = product.id;
    activeTab = product.category;
    document.querySelectorAll('#catalogTabs .nav-link').forEach(t => t.classList.toggle('active', t.dataset.tab === product.category));
    document.querySelectorAll('.filter-cpu').forEach(cb => { cb.checked = cb.value === 'all'; });
    document.querySelectorAll('.filter-gpu').forEach(cb => { cb.checked = cb.value === 'all'; });
    document.querySelectorAll('.filter-ram-capacity').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.filter-ram-type').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.filter-socket').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.filter-storage-type').forEach(cb => { cb.checked = false; });
    document.querySelectorAll('.filter-cooling-type').forEach(cb => { cb.checked = false; });
    if (searchInput) searchInput.value = '';
  }
  hideSuggestions();
  filterProducts();
}

function renderProducts(products) {
  const grid = document.getElementById('catalogGrid');
  const noResults = document.getElementById('noResults');
  const resultsCount = document.getElementById('resultsCount');
  if (!grid) return;

  grid.innerHTML = '';

  if (products.length === 0) {
    noResults?.classList.remove('d-none');
    if (resultsCount) resultsCount.textContent = 'Найдено: 0';
    return;
  }
  noResults?.classList.add('d-none');

  const isBuild = p => p.category === 'builds';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'col-sm-6 col-lg-4';
    const hasImage = !!p.image;
    const detailsHtml = isBuild(p)
      ? [
          p.ram && `<li><span class="detail-label">Память:</span> ${p.ram}</li>`,
          p.storage && `<li><span class="detail-label">Накопитель:</span> ${p.storage}</li>`,
          p.cooling && `<li><span class="detail-label">Охлаждение:</span> ${p.cooling}</li>`
        ].filter(Boolean).join('')
      : (p.socket ? `<li><span class="detail-label">Сокет:</span> ${p.socket}</li>` : '');
    const specs = p.specs || p.name || '';
    const safeName = (p.name || '').replace(/"/g, '&quot;');
    card.innerHTML = `
      <div class="card catalog-card product-card" data-id="${(p.id || '').toString().replace(/"/g, '&quot;')}" data-name="${safeName}" data-price="${p.price}" data-specs="${specs.replace(/"/g, '&quot;')}">
        <div class="product-photo">
          ${hasImage ? `<img src="${(p.image || '').replace(/"/g, '&quot;')}" alt="${safeName}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.add('visible')">` : ''}
          <div class="product-photo-placeholder ${hasImage ? '' : 'visible'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16"><path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/><path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/></svg>
            <span>Нет фото</span>
          </div>
        </div>
        <div class="card-body">
          <span class="product-badge text-nowrap">${specs}</span>
          <h5 class="card-title product-name">${safeName}</h5>
          <ul class="product-details">${detailsHtml}</ul>
          <p class="product-price">${(p.price || 0).toLocaleString('ru-RU')} ₽</p>
          <button class="btn btn-synth btn-sm w-100 btn-instock">В наличии</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  const word = activeTab === 'builds' ? 'сборок' : (activeTab === 'all' ? 'позиций' : 'товаров');
  if (resultsCount) resultsCount.textContent = `Найдено: ${products.length} ${word}`;

  document.querySelectorAll('.btn-instock').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openInstockModal();
    });
  });
}

function openInstockModal() {
  var titleEl = document.getElementById('instockModalTitle');
  var textEl = document.getElementById('instockModalText');
  if (titleEl) titleEl.textContent = 'В наличии';
  if (textEl) textEl.textContent = 'В наличии для сборки ПК';
  var modalEl = document.getElementById('instockModal');
  if (modalEl) {
    var modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

function filterProducts() {
  if (selectedProductId != null) {
    const one = allProducts.filter(p => (p.id || '') === selectedProductId);
    selectedProductId = null;
    renderProducts(one);
    return;
  }

  const searchVal = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';
  const cpuVal = document.querySelector('input[name="cpu"]:checked')?.value || 'all';
  const gpuVal = document.querySelector('input[name="gpu"]:checked')?.value || 'all';
  const priceMin = parseInt(document.getElementById('priceMin')?.value, 10) || 0;
  const priceMax = parseInt(document.getElementById('priceMax')?.value, 10) || Infinity;
  const sortVal = document.getElementById('sortSelect')?.value || 'default';
  const ramCapacities = Array.from(document.querySelectorAll('.filter-ram-capacity:checked')).map(c => c.value);
  const ramTypes = Array.from(document.querySelectorAll('.filter-ram-type:checked')).map(c => c.value);
  const sockets = Array.from(document.querySelectorAll('.filter-socket:checked')).map(c => c.value);
  const storageTypes = Array.from(document.querySelectorAll('.filter-storage-type:checked')).map(c => c.value);
  const coolingTypes = Array.from(document.querySelectorAll('.filter-cooling-type:checked')).map(c => c.value);

  let filtered = allProducts.filter(p => {
    if (activeTab !== 'all' && p.category !== activeTab) return false;
    const matchSearch = !searchVal ||
      (p.name || '').toLowerCase().includes(searchVal) ||
      (p.specs && String(p.specs).toLowerCase().includes(searchVal)) ||
      (p.ram && p.ram.toLowerCase().includes(searchVal)) ||
      (p.storage && p.storage.toLowerCase().includes(searchVal)) ||
      (p.cooling && p.cooling.toLowerCase().includes(searchVal)) ||
      (p.cpu === 'intel' && searchVal.includes('intel')) ||
      (p.cpu === 'amd' && searchVal.includes('amd')) ||
      (p.gpu === 'nvidia' && (searchVal.includes('nvidia') || searchVal.includes('rtx') || searchVal.includes('gtx'))) ||
      (p.gpu === 'amd' && searchVal.includes('amd')) ||
      (p.socket && String(p.socket).toLowerCase().includes(searchVal));
    const matchCpu = cpuVal === 'all' || (p.category === 'builds' && p.cpu === cpuVal) || (p.category === 'cpu' && ((cpuVal === 'intel' && (p.name || '').includes('Intel')) || (cpuVal === 'amd' && (p.name || '').includes('AMD'))));
    const matchGpu = gpuVal === 'all' || (p.category === 'builds' && p.gpu === gpuVal) || (p.category === 'gpu' && ((gpuVal === 'nvidia' && (p.name || '').includes('RTX')) || (gpuVal === 'amd' && (p.name || '').includes('RX'))));
    const matchPrice = (p.price || 0) >= priceMin && (p.price || 0) <= priceMax;
    const matchRamCap = ramCapacities.length === 0 || !p.ramCapacity || ramCapacities.includes(String(p.ramCapacity));
    const matchRamType = ramTypes.length === 0 || !p.ramType || ramTypes.includes(p.ramType);
    const matchSocket = sockets.length === 0 || !p.socket || sockets.includes(p.socket);
    const matchStorageType = storageTypes.length === 0 || p.category !== 'storage' || (storageTypes.includes('m2') && p.isM2) || (storageTypes.includes('hdd') && !p.isM2);
    const matchCoolingType = coolingTypes.length === 0 || !p.coolingType || coolingTypes.includes(p.coolingType);
    return matchSearch && matchCpu && matchGpu && matchPrice && matchRamCap && matchRamType && matchSocket && matchStorageType && matchCoolingType;
  });

  if (sortVal === 'price-asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (sortVal === 'price-desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  else if (sortVal === 'name') filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  renderProducts(filtered);
}

function resetSidebarFilters() {
  var cpuAll = document.querySelector('input[name="cpu"][value="all"]');
  var gpuAll = document.querySelector('input[name="gpu"][value="all"]');
  if (cpuAll) cpuAll.checked = true;
  if (gpuAll) gpuAll.checked = true;
  document.querySelectorAll('.filter-ram-capacity, .filter-ram-type, .filter-socket, .filter-storage-type, .filter-cooling-type').forEach(function (cb) { cb.checked = false; });
}

let suggestTimeout = null;
function onSearchInput() {
  const val = document.getElementById('searchInput')?.value?.trim() || '';
  clearTimeout(suggestTimeout);
  if (val.length > 0) {
    resetSidebarFilters();
    activeTab = 'all';
    var tabsEl = document.getElementById('catalogTabs');
    if (tabsEl) {
      tabsEl.querySelectorAll('.nav-link').forEach(function (t) { t.classList.remove('active'); t.classList.toggle('active', t.getAttribute('data-tab') === 'all'); });
    }
  }
  if (val.length < 2) {
    hideSuggestions();
    filterProducts();
    return;
  }
  suggestTimeout = setTimeout(() => {
    const list = getSearchSuggestions(val);
    showSuggestions(list);
    filterProducts();
  }, 150);
}

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('catalogGrid');
  if (!grid) return;

  // Сразу показываем готовые сборки, потом подгружаем JSON
  if (allProducts.length === 0) {
    allProducts = readyBuilds.slice();
  }
  filterProducts();

  loadCatalog().then(function () {
    filterProducts();
  }).catch(function () {
    filterProducts();
  });

  var tabsEl = document.getElementById('catalogTabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;
      e.preventDefault();
      activeTab = btn.getAttribute('data-tab');
      tabsEl.querySelectorAll('.nav-link').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      filterProducts();
    });
  }

  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', onSearchInput);
  searchInput?.addEventListener('focus', () => {
    const val = searchInput.value?.trim() || '';
    if (val.length >= 2) showSuggestions(getSearchSuggestions(val));
  });
  searchInput?.addEventListener('blur', () => {
    setTimeout(hideSuggestions, 200);
  });

  document.getElementById('searchSuggestions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.suggestion-item');
    if (!btn) return;
    const type = btn.dataset.type;
    if (type === 'category') {
      applySuggestion('category', btn.dataset.tab, btn.dataset.filter || undefined, null);
    } else if (type === 'product') {
      const id = btn.dataset.id;
      const container = btn.closest('#searchSuggestions');
      const product = allProducts.find(p => (p.id || '').toString() === id) || (container && container._suggestionById && container._suggestionById[id]);
      if (product) applySuggestion('product', null, null, product);
    }
  });

  document.getElementById('sortSelect')?.addEventListener('change', () => filterProducts());
  document.querySelectorAll('.filter-cpu, .filter-gpu').forEach(cb => cb.addEventListener('change', () => filterProducts()));
  document.querySelectorAll('.filter-ram-capacity, .filter-ram-type, .filter-socket, .filter-storage-type, .filter-cooling-type').forEach(cb => cb.addEventListener('change', () => filterProducts()));
  document.getElementById('priceMin')?.addEventListener('input', () => filterProducts());
  document.getElementById('priceMax')?.addEventListener('input', () => filterProducts());

  document.getElementById('resetFilters')?.addEventListener('click', () => {
    document.querySelectorAll('.filter-cpu').forEach(cb => { cb.checked = cb.value === 'all'; });
    document.querySelectorAll('.filter-gpu').forEach(cb => { cb.checked = cb.value === 'all'; });
    document.querySelectorAll('.filter-ram-capacity, .filter-ram-type, .filter-socket, .filter-storage-type, .filter-cooling-type').forEach(cb => { cb.checked = false; });
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = 'default';
    activeTab = 'all';
    document.querySelectorAll('#catalogTabs .nav-link').forEach(t => t.classList.toggle('active', t.dataset.tab === 'all'));
    filterProducts();
  });

  document.getElementById('clearSearch')?.addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    hideSuggestions();
    filterProducts();
  });

  filterProducts();
});
