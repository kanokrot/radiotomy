const referenceDataUrl = new URL('./reference-series.json', import.meta.url);
const referenceCollections = {
  'ct-male': {
    sex: 'Male', dataset: 'Visible Human Male', modality: 'CT axial', region: 'ทั้งร่างกาย',
    kind: 'manifest', key: 'male', source: 'https://www.nlm.nih.gov/research/visible/visible_human.html',
    description: 'ภาพ CT axial ของ Visible Human Male เรียงตามไฟล์ที่ NLM เปิดให้ดาวน์โหลด เลขไฟล์ต้นทางมีช่วงขาด จึงนับตามจำนวนไฟล์จริงที่พบ ไม่แสดงเป็นระยะ slice ต่อเนื่อง',
    limitation: 'อาสาสมัครหนึ่งรายต่อเพศ · ไม่ใช่เคสวินิจฉัย · ไฟล์ PNG ไม่มี DICOM metadata หรือ HU · ชุดชายมีไฟล์ CT ที่พบ 521 ภาพและเลขไฟล์ขาดช่วง',
    crop: false
  },
  'ct-female': {
    sex: 'Female', dataset: 'Visible Human Female', modality: 'CT axial', region: 'ทั้งร่างกาย',
    kind: 'manifest', key: 'female', source: 'https://www.nlm.nih.gov/research/visible/visible_human.html',
    description: 'ภาพ CT axial ของ Visible Human Female จากรายการไฟล์ PNG ของ NLM จำนวนภาพแสดงตามไฟล์ที่มีอยู่จริงใน manifest',
    limitation: 'อาสาสมัครหนึ่งรายต่อเพศ · ไม่ใช่เคสวินิจฉัย · ไฟล์ PNG ไม่มี DICOM metadata หรือ HU',
    crop: false
  },
  'mri-head': {
    sex: 'Male', dataset: 'Visible Human Male', modality: 'MRI T1', region: 'ศีรษะ · ภาพตัวอย่าง',
    kind: 'images', images: ['https://www.nlm.nih.gov/research/visible/image/mri/m_vm1125.t1.png'],
    source: 'https://www.nlm.nih.gov/research/visible/mri.html',
    description: 'ภาพตัวอย่าง MRI T1 จากหน้า MRI ของ NLM มีภาพที่ระบุไว้ในชุดนี้ 1 ภาพ',
    limitation: 'อาสาสมัครหนึ่งราย · ภาพตัวอย่าง 1 ภาพ ไม่ใช่ชุด slice ต่อเนื่องหรือเคสวินิจฉัย · ไม่มี HU',
    crop: false
  },
  'anatomy-male': {
    sex: 'Male', dataset: 'Visible Human Male', modality: 'Cryosection · ภาพตัดกายวิภาค', region: 'ทั้งร่างกาย · ภาพตัวอย่างไม่ต่อเนื่อง',
    kind: 'images', images: ['a_vm1125.png','a_vm1450.png','a_vm1675.png','a_vm1950.png','a_vm2300.png','a_vm2825.png'].map(name => `https://www.nlm.nih.gov/research/visible/image/png_mri/${name}`),
    source: 'https://www.nlm.nih.gov/research/visible/full_color_png.html',
    description: 'NLM ให้ภาพตัวอย่าง full-color ของชาย 6 ภาพ เป็นภาพที่เลือกมา ไม่ใช่ slice ต่อเนื่อง แสดงเฉพาะบริเวณร่างกายโดยซูมจากกึ่งกลางภาพ ต้นฉบับเต็มเปิดดูได้ด้วยปุ่มบนภาพ',
    limitation: 'อาสาสมัครหนึ่งราย · ภาพตัวอย่างไม่ต่อเนื่อง · ไม่ใช่เคสวินิจฉัย · ไม่มี HU',
    crop: true
  },
  'anatomy-female': {
    sex: 'Female', dataset: 'Visible Human Female', modality: 'Cryosection · ภาพตัดกายวิภาค', region: 'ทั้งร่างกาย · ภาพตัวอย่างไม่ต่อเนื่อง',
    kind: 'images', images: ['avf1067a.png','avf1588a.png','avf1588b.png','avf1588c.png','avf2680a.png'].map(name => `https://www.nlm.nih.gov/research/visible/image/png_mri/${name}`),
    source: 'https://www.nlm.nih.gov/research/visible/full_color_png.html',
    description: 'NLM ให้ภาพตัวอย่าง full-color ของหญิง 5 ภาพ เป็นภาพที่เลือกมา ไม่ใช่ slice ต่อเนื่อง แสดงเฉพาะบริเวณร่างกายโดยซูมจากกึ่งกลางภาพ ต้นฉบับเต็มเปิดดูได้ด้วยปุ่มบนภาพ',
    limitation: 'อาสาสมัครหนึ่งราย · ภาพตัวอย่างไม่ต่อเนื่อง · ไม่ใช่เคสวินิจฉัย · ไม่มี HU',
    crop: true
  }
};
referenceCollections['anatomy-male'].description = '\u0e20\u0e32\u0e1e\u0e2a\u0e35\u0e15\u0e31\u0e14\u0e02\u0e27\u0e32\u0e07\u0e08\u0e32\u0e01 NLM 6 \u0e20\u0e32\u0e1e\u0e44\u0e21\u0e48\u0e15\u0e48\u0e2d\u0e40\u0e19\u0e37\u0e48\u0e2d\u0e07; \u0e04\u0e23\u0e2d\u0e1b\u0e23\u0e32\u0e22\u0e20\u0e32\u0e1e\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e2a\u0e14\u0e07\u0e0a\u0e34\u0e49\u0e19\u0e15\u0e31\u0e14\u0e41\u0e25\u0e30\u0e15\u0e31\u0e14\u0e2a\u0e40\u0e01\u0e25\u0e01\u0e31\u0e1a';
referenceCollections['anatomy-female'].description = '\u0e20\u0e32\u0e1e\u0e2a\u0e35\u0e15\u0e31\u0e14\u0e02\u0e27\u0e32\u0e07\u0e08\u0e32\u0e01 NLM 5 \u0e20\u0e32\u0e1e\u0e44\u0e21\u0e48\u0e15\u0e48\u0e2d\u0e40\u0e19\u0e37\u0e48\u0e2d\u0e07; \u0e04\u0e23\u0e2d\u0e1b\u0e23\u0e32\u0e22\u0e20\u0e32\u0e1e\u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e41\u0e2a\u0e14\u0e07\u0e0a\u0e34\u0e49\u0e19\u0e15\u0e31\u0e14\u0e41\u0e25\u0e30\u0e15\u0e31\u0e14\u0e2a\u0e40\u0e01\u0e25\u0e01\u0e31\u0e1a';

let referenceManifest;
let activeReferenceKey = 'ct-male';
let referenceIndex = 260;
let referencePreloads = new Map();
let dragPointer = null;
let dragRemainder = 0;
let fullCryosection = false;
let mobilePanelsInitialized = false;
let contrastPreset = 'normal';
let renderSequence = 0;

const byId = id => document.getElementById(id);
const pageIds = ['atlas', 'quiz', 'positioning', 'bmd'];
const pageRoutes = { atlas: '/atlas', quiz: '/reference', positioning: '/positioning', bmd: '/bmd' };
const routePages = new Map(Object.entries(pageRoutes).map(([page, route]) => [route, page]));
routePages.set('/', 'atlas');
routePages.set('/quiz', 'quiz');

function setReferenceViewportHeight() {
  const header = document.querySelector('body > header');
  const quiz = byId('page-quiz');
  if (!header || !quiz) return;
  quiz.style.setProperty('--reference-header-height', `${header.getBoundingClientRect().height}px`);
}

function showPage(id) {
  if (!pageIds.includes(id)) return;
  pageIds.forEach(page => {
    const main = byId(`page-${page}`);
    if (main) main.hidden = page !== id;
    document.querySelectorAll(`[data-page="${page}"]`).forEach(button => {
      button.classList.toggle('active', page === id);
      if (page === id) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  });
  document.body.classList.toggle('reference-open', id === 'quiz');
  if (id === 'positioning') requestAnimationFrame(() => window.chestPosition3D?.resize());
  if (id === 'quiz') {
    if (window.matchMedia('(max-width: 720px)').matches && !mobilePanelsInitialized) {
      setPanelCollapsed('left', true);
      setPanelCollapsed('right', true);
      mobilePanelsInitialized = true;
    }
    setReferenceViewportHeight();
    renderReference();
    requestAnimationFrame(setReferenceViewportHeight);
  }
}

function navigateToPage(id) {
  if (!pageIds.includes(id)) return;
  const route = pageRoutes[id];
  if (window.location.pathname !== route) window.history.pushState({ page: id }, '', route);
  showPage(id);
}

function syncPageFromLocation() {
  const page = routePages.get(window.location.pathname.replace(/\/$/, '') || '/') || 'atlas';
  if (!routePages.has(window.location.pathname.replace(/\/$/, '') || '/')) {
    window.history.replaceState({ page }, '', pageRoutes[page]);
  }
  showPage(page);
}

document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => navigateToPage(button.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(button => button.addEventListener('click', () => navigateToPage(button.dataset.goto)));
window.addEventListener('popstate', syncPageFromLocation);
window.addEventListener('resize', setReferenceViewportHeight);
window.matchMedia('(max-width: 720px)').addEventListener('change', event => {
  if (event.matches && !mobilePanelsInitialized && !byId('page-quiz')?.hidden) {
    setPanelCollapsed('left', true);
    setPanelCollapsed('right', true);
    mobilePanelsInitialized = true;
  }
});

function referenceFiles(config) {
  if (!config) return [];
  if (config.kind === 'images') return config.images;
  const series = referenceManifest?.[config.key];
  if (!series || !Array.isArray(series.files)) return [];
  const excluded = config.key === 'male' ? new Set(['cvm2888f.png', 'cvm2893f.png']) : config.key === 'female' ? new Set(['cvf2734f.png']) : new Set();
  const files = config.key === 'female' ? series.files.slice(399) : series.files;
  return files.filter(file => !excluded.has(file)).map(file => new URL(file, series.base).href);
}

function referenceFileName(url) {
  try { return new URL(url).pathname.split('/').pop(); } catch { return ''; }
}

function preloadReference(urls, index) {
  const first = Math.max(0, index - 5);
  const last = Math.min(urls.length - 1, index + 5);
  for (let i = first; i <= last; i++) {
    const url = urls[i];
    if (!referencePreloads.has(url)) {
      const image = new Image();
      image.decoding = 'async';
      image.crossOrigin = 'anonymous';
      image.src = proxyReferenceUrl(url);
      referencePreloads.set(url, image);
    }
  }
  for (const [url] of referencePreloads) {
    if (!urls.slice(first, last + 1).includes(url)) referencePreloads.delete(url);
  }
}

function proxyReferenceUrl(url) {
  const proxyOrigin = location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : location.origin;
  return `${proxyOrigin}/nlm-proxy?url=${encodeURIComponent(url)}`;
}

function percentileFromHistogram(histogram, total, percentile) {
  const target = (total - 1) * percentile;
  const lowRank = Math.floor(target);
  const highRank = Math.ceil(target);
  let cumulative = 0;
  let low = null;
  let high = 255;
  for (let value = 0; value < 256; value++) {
    cumulative += histogram[value];
    if (cumulative > lowRank && low === null) low = value;
    if (cumulative > highRank) { high = value; break; }
  }
  return [low ?? 0, high];
}

function cryoCropBox(filename, width, height) {
  const boxes = {
    'a_vm1125.png': [720, 320, 650, 620],
    'a_vm1450.png': [300, 100, 1450, 820],
    'a_vm1675.png': [250, 170, 1500, 760],
    'a_vm1950.png': [390, 130, 1260, 800],
    'a_vm2300.png': [360, 200, 1320, 560],
    'a_vm2825.png': [340, 250, 1370, 650],
    'avf1067a.png': [780, 265, 520, 650],
    'avf1588a.png': [540, 220, 1010, 720],
    'avf1588b.png': [540, 220, 1010, 720],
    'avf1588c.png': [540, 220, 1010, 720],
    'avf2680a.png': [720, 300, 640, 560]
  };
  const box = boxes[filename];
  if (!box || width < 1 || height < 1) return null;
  const [left, top, cropWidth, cropHeight] = box;
  const x = Math.max(0, Math.min(width - 1, Math.round(left * width / 2048)));
  const y = Math.max(0, Math.min(height - 1, Math.round(top * height / 1216)));
  return { x, y, width: Math.min(width - x, Math.round(cropWidth * width / 2048)), height: Math.min(height - y, Math.round(cropHeight * height / 1216)) };
}

function renderCryoPicker(urls, config) {
  const picker = byId('cryo-thumbnails');
  if (!picker) return;
  picker.replaceChildren();
  urls.forEach((url, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'cryo-thumb'; button.setAttribute('aria-label', `??? ${index + 1}: ${referenceFileName(url)}`);
    button.setAttribute('aria-pressed', index === referenceIndex ? 'true' : 'false');
    const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.src = proxyReferenceUrl(url);
    const label = document.createElement('span'); label.textContent = String(index + 1);
    button.append(image, label); button.addEventListener('click', () => { referenceIndex = index; renderReference(); });
    picker.append(button);
  });
}

function drawReferenceImage(image, url, sequence) {
  if (sequence !== renderSequence) return;
  const source = document.createElement('canvas');
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const sourceImage = sourceContext.getImageData(0, 0, source.width, source.height);
  if (referenceCollections[activeReferenceKey].crop) {
    const output = byId('reference-canvas');
    const crop = cryoCropBox(referenceFileName(url), source.width, source.height);
    const region = crop || { x: 0, y: 0, width: source.width, height: source.height };
    output.width = region.width; output.height = region.height;
    output.getContext('2d').putImageData(sourceContext.getImageData(region.x, region.y, region.width, region.height), 0, 0);
    output.dataset.renderedUrl = url;
    output.setAttribute('aria-label', `${referenceFileName(url)} · ภาพสีต้นฉบับ`);
    return;
  }
  const { data, width, height } = sourceImage;
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const value = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    gray[p] = value;
    histogram[value]++;
  }
  const [, fullP99] = percentileFromHistogram(histogram, gray.length, 0.99);
  const maskThreshold = Math.max(4, Math.floor(fullP99 * 0.1));
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let left = width, top = height, right = -1, bottom = -1, largest = 0;
  for (let seed = 0; seed < gray.length; seed++) {
    if (visited[seed] || gray[seed] <= maskThreshold) continue;
    let head = 0, tail = 0, minX = width, minY = height, maxX = -1, maxY = -1;
    visited[seed] = 1; queue[tail++] = seed;
    while (head < tail) {
      const point = queue[head++], x = point % width, y = Math.floor(point / width);
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (!visited[next] && gray[next] > maskThreshold) { visited[next] = 1; queue[tail++] = next; }
      }
    }
    if (tail > largest) { largest = tail; left = minX; right = maxX + 1; top = minY; bottom = maxY + 1; }
  }
  if (right <= left || bottom <= top || largest < width * height * 0.02) { left = 0; top = 0; right = width; bottom = height; }
  const padX = Math.round((right - left) * 0.4);
  const padY = Math.round((bottom - top) * 0.4);
  left = Math.max(0, left - padX); top = Math.max(0, top - padY);
  right = Math.min(width, right + padX); bottom = Math.min(height, bottom + padY);
  const cropWidth = right - left, cropHeight = bottom - top;
  const cropHistogram = new Uint32Array(256);
  let cropPixels = 0;
  for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) { cropHistogram[gray[y * width + x]]++; cropPixels++; }
  let [low, high] = percentileFromHistogram(cropHistogram, cropPixels, 0.01);
  const p99 = percentileFromHistogram(cropHistogram, cropPixels, 0.99)[1];
  let imageMaximum = 255;
  while (imageMaximum > 0 && cropHistogram[imageMaximum] === 0) imageMaximum--;
  high = Math.max(p99, Math.floor(imageMaximum * 0.9));
  if (contrastPreset === 'bone') {
    low = percentileFromHistogram(cropHistogram, cropPixels, 0.85)[0];
    high = percentileFromHistogram(cropHistogram, cropPixels, 1)[1];
  } else if (contrastPreset === 'tissue') {
    low = percentileFromHistogram(cropHistogram, cropPixels, 0.01)[0];
    high = percentileFromHistogram(cropHistogram, cropPixels, 0.99)[1];
  }
  if (high <= low) { low = 0; high = Math.max(1, fullP99); }
  const output = byId('reference-canvas');
  output.width = width; output.height = height;
  const context = output.getContext('2d');
  const outputImage = context.createImageData(width, height);
  const scale = 255 / (high - low);
  let out = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const stretched = Math.max(0, Math.min(1, (gray[y * width + x] - low) * scale / 255));
    const value = Math.round(stretched * 255);
    outputImage.data[out++] = value; outputImage.data[out++] = value; outputImage.data[out++] = value; outputImage.data[out++] = 255;
  }
  context.putImageData(outputImage, 0, 0);
  output.dataset.renderedUrl = url;
  output.setAttribute('aria-label', `${referenceFileName(url)} · full frame ${width}×${height} · contrast ${contrastPreset}`);
}

function renderReference() {
  const config = referenceCollections[activeReferenceKey];
  const urls = referenceFiles(config);
  const canvas = byId('reference-canvas');
  const range = byId('slice-range');
  if (!config || !canvas || !range) return;
  if (!urls.length) {
    byId('slice-count').textContent = 'ไม่พบรายการภาพ';
    canvas.width = canvas.height = 0;
    return;
  }
  referenceIndex = Math.max(0, Math.min(referenceIndex, urls.length - 1));
  const viewport = byId('ct-image');
  viewport.classList.toggle('crop-cryo', config.crop);
  byId('page-quiz').classList.toggle('cryo-mode', config.crop);
  byId('reference-display-controls').hidden = config.crop;
  byId('slice-range').parentElement.hidden = config.crop;
  byId('reference-crop-toggle').hidden = true;
  byId('reference-crop-note').hidden = !config.crop;
  byId('reference-crop-note').textContent = config.crop ? '\u0e04\u0e23\u0e2d\u0e1b\u0e41\u0e22\u0e01\u0e15\u0e32\u0e21\u0e20\u0e32\u0e1e \u0e40\u0e01\u0e47\u0e1a\u0e02\u0e2d\u0e1a\u0e0a\u0e34\u0e49\u0e19\u0e15\u0e31\u0e14\u0e44\u0e27\u0e49 \u0e41\u0e25\u0e30\u0e15\u0e31\u0e14\u0e1e\u0e37\u0e49\u0e19\u0e2b\u0e25\u0e31\u0e07\u0e41\u0e25\u0e30\u0e2a\u0e40\u0e01\u0e25\u0e2d\u0e2d\u0e01' : '';
  byId('cryo-caption').hidden = !config.crop;
  byId('cryo-picker-bar').hidden = !config.crop;
  byId('cryo-prev').disabled = referenceIndex === 0;
  byId('cryo-next').disabled = referenceIndex >= urls.length - 1;
  if (config.crop) renderCryoPicker(urls, config);
  byId('reference-title').textContent = `${config.dataset} · ${config.modality}`;
  byId('reference-dataset').textContent = config.dataset;
  byId('reference-modality').textContent = config.modality;
  byId('reference-region').textContent = config.region;
  const ctExclusion = config.key === 'male' ? ' \u0e15\u0e31\u0e14 cvm2888f.png \u0e41\u0e25\u0e30 cvm2893f.png \u0e17\u0e49\u0e32\u0e22\u0e0a\u0e38\u0e14\u0e17\u0e35\u0e48\u0e21\u0e35\u0e25\u0e32\u0e22\u0e23\u0e1a\u0e01\u0e27\u0e19; \u0e40\u0e2b\u0e25\u0e37\u0e2d 519/521 \u0e20\u0e32\u0e1e.' : config.key === 'female' ? ' \u0e15\u0e31\u0e14 399 \u0e20\u0e32\u0e1e\u0e15\u0e49\u0e19\u0e0a\u0e38\u0e14\u0e17\u0e35\u0e48\u0e2d\u0e48\u0e32\u0e19\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e44\u0e21\u0e48\u0e0a\u0e31\u0e14 \u0e41\u0e25\u0e30 cvf2734f.png \u0e17\u0e49\u0e32\u0e22\u0e0a\u0e38\u0e14\u0e17\u0e35\u0e48\u0e21\u0e37\u0e14/\u0e21\u0e35\u0e25\u0e32\u0e22\u0e23\u0e1a\u0e01\u0e27\u0e19; \u0e40\u0e2b\u0e25\u0e37\u0e2d 1,334/1,734 \u0e20\u0e32\u0e1e.' : '';
  const manifestCount = config.key === 'male' ? ' (\u0e08\u0e32\u0e01 521 \u0e44\u0e1f\u0e25\u0e4c\u0e43\u0e19 manifest)' : config.key === 'female' ? ' (\u0e08\u0e32\u0e01 1,734 \u0e44\u0e1f\u0e25\u0e4c\u0e43\u0e19 manifest)' : '';
  byId('reference-total').textContent = `${urls.length.toLocaleString('th-TH')} \u0e20\u0e32\u0e1e${config.kind === 'images' ? ' (\u0e15\u0e31\u0e27\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e08\u0e32\u0e01 NLM)' : manifestCount}`;
  byId('reference-description').textContent = config.description + ctExclusion;
  byId('reference-limitation').textContent = config.limitation;
  const source = byId('reference-source');
  source.href = config.source;
  source.textContent = `แหล่งที่มา NLM · ${new URL(config.source).pathname.split('/').pop()}`;
  byId('reference-orientation').textContent = 'R/L: ยังไม่ยืนยันทิศ';
  range.min = '0'; range.max = String(urls.length - 1); range.value = String(referenceIndex);
  const url = urls[referenceIndex], name = referenceFileName(url);
  if (config.crop && name === 'a_vm2825.png') byId('reference-crop-note').textContent = '\u0e20\u0e32\u0e1e\u0e19\u0e35\u0e49\u0e21\u0e35\u0e0a\u0e34\u0e49\u0e19\u0e15\u0e31\u0e14\u0e2a\u0e2d\u0e07\u0e2a\u0e48\u0e27\u0e19 \u0e04\u0e23\u0e2d\u0e1b\u0e40\u0e01\u0e47\u0e1a\u0e17\u0e31\u0e49\u0e07\u0e2a\u0e2d\u0e07\u0e2a\u0e48\u0e27\u0e19\u0e08\u0e36\u0e07\u0e22\u0e31\u0e07\u0e40\u0e2b\u0e47\u0e19\u0e40\u0e08\u0e25\u0e04\u0e31\u0e48\u0e19\u0e01\u0e25\u0e32\u0e07';
  byId('slice-count').textContent = `Slice ${referenceIndex + 1} / ${urls.length}`;
  if (config.crop) byId('cryo-caption').textContent = `${config.dataset} \u00b7 Cryosection \u00b7 ${referenceIndex + 1}/${urls.length} \u00b7 ${name}`;
  byId('reference-file').textContent = name;
  const sequence = ++renderSequence;
  const image = referencePreloads.get(url) || new Image();
  image.onload = () => drawReferenceImage(image, url, sequence);
  image.onerror = () => { if (sequence === renderSequence) byId('reference-file').textContent = `${name} ? ????????????????`; };
  if (!referencePreloads.has(url)) { image.crossOrigin = 'anonymous'; image.src = proxyReferenceUrl(url); }
  else if (image.complete && image.naturalWidth) drawReferenceImage(image, url, sequence);
  canvas.setAttribute('aria-label', `${config.dataset}, ${config.modality}, ${name} — ทิศ R/L ยังไม่ยืนยัน`);
  preloadReference(urls, referenceIndex);
  document.querySelectorAll('.reference-choice').forEach(button => button.classList.toggle('on', button.dataset.reference === activeReferenceKey));
}

function moveReference(delta) {
  const urls = referenceFiles(referenceCollections[activeReferenceKey]);
  if (!urls.length) return;
  const next = Math.max(0, Math.min(urls.length - 1, referenceIndex + delta));
  if (next === referenceIndex) return;
  referenceIndex = next;
  renderReference();
}

  document.querySelectorAll('.reference-choice').forEach(button => button.addEventListener('click', () => {
  activeReferenceKey = button.dataset.reference;
  referenceIndex = button.dataset.reference === 'ct-male' ? 260 : button.dataset.reference === 'ct-female' ? 500 : 0;
  renderReference();
}));

byId('cryo-prev')?.addEventListener('click', () => moveReference(-1));
byId('cryo-next')?.addEventListener('click', () => moveReference(1));

byId('cryo-prev')?.addEventListener('click', () => moveReference(-1));
byId('cryo-next')?.addEventListener('click', () => moveReference(1));

byId('slice-range')?.addEventListener('input', event => {
  referenceIndex = Number(event.target.value);
  renderReference();
});

byId('ct-image')?.addEventListener('wheel', event => {
  event.preventDefault();
  const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
  const amount = Math.max(1, Math.min(10, Math.round(Math.abs(delta) / 100)));
  moveReference(delta > 0 ? amount : -amount);
}, { passive: false });

document.addEventListener('keydown', event => {
  if (byId('page-quiz')?.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const steps = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
  if (steps[event.key]) {
    event.preventDefault();
    moveReference(steps[event.key]);
  }
});

const imageViewport = byId('ct-image');
imageViewport?.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  dragPointer = { id: event.pointerId, y: event.clientY };
  dragRemainder = 0;
  imageViewport.setPointerCapture(event.pointerId);
});
imageViewport?.addEventListener('pointermove', event => {
  if (!dragPointer || dragPointer.id !== event.pointerId) return;
  const diff = dragPointer.y - event.clientY;
  dragPointer.y = event.clientY;
  dragRemainder += diff;
  const slices = Math.trunc(dragRemainder / 22);
  if (slices) {
    dragRemainder -= slices * 22;
    moveReference(slices);
  }
});
const stopDragging = event => {
  if (dragPointer?.id === event.pointerId) dragPointer = null;
};
imageViewport?.addEventListener('pointerup', stopDragging);
imageViewport?.addEventListener('pointercancel', stopDragging);

function setPanelCollapsed(side, collapsed) {
  const page = byId('page-quiz');
  page.classList.toggle(`${side}-collapsed`, collapsed);
  requestAnimationFrame(() => {
    const restore = byId(`restore-${side}-panel`);
    restore.style.display = collapsed ? 'block' : 'none';
  });
}
byId('close-left-panel')?.addEventListener('click', () => setPanelCollapsed('left', true));
byId('toggle-left-panel')?.addEventListener('click', () => setPanelCollapsed('left', true));
byId('restore-left-panel')?.addEventListener('click', () => setPanelCollapsed('left', false));
byId('close-right-panel')?.addEventListener('click', () => setPanelCollapsed('right', true));
byId('toggle-right-panel')?.addEventListener('click', () => setPanelCollapsed('right', true));
byId('restore-right-panel')?.addEventListener('click', () => setPanelCollapsed('right', false));
byId('reference-crop-toggle')?.addEventListener('click', event => {
  fullCryosection = !fullCryosection;
  byId('ct-image').classList.toggle('crop-cryo', !fullCryosection);
  event.currentTarget.textContent = fullCryosection ? 'ครอปเฉพาะร่างกาย' : 'ดูภาพต้นฉบับเต็ม';
});

document.querySelectorAll('[data-contrast]').forEach(button => button.addEventListener('click', () => {
  contrastPreset = button.dataset.contrast;
  document.querySelectorAll('[data-contrast]').forEach(item => { item.classList.toggle('on', item === button); item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); });
  renderReference();
}));
byId('contrast-reset')?.addEventListener('click', () => {
  contrastPreset = 'normal';
  document.querySelectorAll('[data-contrast]').forEach(item => { const active = item.dataset.contrast === 'normal'; item.classList.toggle('on', active); item.setAttribute('aria-pressed', active ? 'true' : 'false'); });
  renderReference();
});

fetch(referenceDataUrl).then(response => {
  if (!response.ok) throw new Error(`โหลด manifest ไม่สำเร็จ (${response.status})`);
  return response.json();
}).then(data => {
  referenceManifest = data;
  if (!byId('page-quiz')?.hidden) renderReference();
}).catch(error => {
  console.error('NLM reference manifest:', error);
  byId('slice-count').textContent = 'โหลดรายการภาพไม่สำเร็จ';
  byId('reference-file').textContent = 'ตรวจการเชื่อมต่อแล้วลองใหม่';
});

const positionList = byId('position-list');
const positionDiagram = byId('position-diagram');
const position3d = byId('position-3d');
let positioningSources = {};
fetch('./positioning-images.json').then(response => {
  if (!response.ok) throw new Error(`positioning image metadata unavailable (${response.status})`);
  return response.json();
}).then(data => {
  positioningSources = data.images;
  if (!byId('page-positioning')?.hidden && document.querySelector('[data-position-tab="image"]')?.classList.contains('on')) {
    showPositionImage(activeChestStudy.image);
  }
}).catch(error => console.error('Positioning image metadata:', error));

const chestStudies = [
  { id: 'pa', title: 'Chest PA · ยืน', view: 'pa', image: 'image', poseNote: 'ฉากจำลองท่ายืน PA: ลำรังสีจากด้านหลังไปด้านหน้า โมเดลนี้ขยับแขนไม่ได้', note: 'ยืนหันหน้าเข้าตัวรับภาพ วางมือที่สะโพกและหมุนไหล่มาด้านหน้า ลำรังสีผ่านจากด้านหลังไปด้านหน้า', quality: 'ปอดทั้งสองข้างและมุม costophrenic ควรอยู่ในภาพ ตรวจการหมุนและระดับการหายใจเข้า', checklist: ['ยืนหันหน้าเข้าตัวรับภาพ', 'ยกคางพ้นทรวงอกและวางมือที่สะโพก', 'หายใจเข้าลึกและกลั้นหายใจ'] },
  { id: 'lateral', title: 'Chest Lateral · ยืน', view: 'lateral', image: 'lateral', poseNote: 'ฉากจำลองท่ายืนด้านข้าง: ด้านซ้ายชิดตัวรับภาพ ลำรังสีจากขวาไปซ้าย โมเดลนี้หมุนได้ทั้งร่างแต่ขยับแขนไม่ได้', note: 'ยืนหันด้านซ้ายแนบตัวรับภาพ ยกแขนขึ้นให้พ้นทรวงอก ลำรังสีผ่านจากด้านขวาไปด้านซ้าย', quality: 'แขนไม่ควรซ้อนทับปอด และควรเห็นปอดทั้งสองข้างถึงมุม costophrenic', checklist: ['ยืนด้านซ้ายแนบตัวรับภาพ', 'ยกแขนขึ้นพ้นทรวงอก', 'หายใจเข้าลึกและกลั้นหายใจ'] },
  { id: 'ap-erect', title: 'Chest AP · นั่ง/ยืน', view: 'ap', image: 'ap', poseNote: 'ฉากจำลองท่า AP ตั้งตรง: ลำรังสีจากด้านหน้าไปด้านหลัง โมเดลยังคงยืนตรง', note: 'ลำรังสีผ่านจากด้านหน้าไปด้านหลัง ใช้เมื่อจัดท่า PA ไม่ได้; ระยะ source-to-image และการขยายภาพอาจต่างจาก PA', quality: 'ตรวจการหมุน ความลึกของการหายใจ และการขยายหัวใจจากระยะถ่ายภาพ', checklist: ['จัดผู้ป่วยนั่งหรือยืนตรงตามสภาพ', 'วางตัวรับภาพด้านหลังทรวงอก', 'หายใจเข้าลึกและกลั้นหายใจ'] },
  { id: 'ap-supine', title: 'Chest AP · นอนหงาย', view: 'supine', image: 'supine', poseNote: 'ฉากจำลองท่านอนหงาย AP: หมุนโมเดลทั้งร่างให้แนวนอน ลำรังสีจากด้านหน้าเข้าหาตัวรับภาพด้านหลัง', note: 'ผู้ป่วยนอนหงายและถ่าย AP แบบ portable ลำรังสีเข้าจากด้านหน้า; ภาพท่านอนอาจแสดงของเหลวในเยื่อหุ้มปอดต่างจากภาพตั้งตรง', quality: 'ระบุว่าถ่ายท่านอน ตรวจการหมุน และประเมินขอบเขตภาพที่ทำได้', checklist: ['จัดผู้ป่วยนอนหงาย', 'วางตัวรับภาพด้านหลังทรวงอก', 'จัดลำรังสี AP ให้ตรงกึ่งกลางทรวงอก'] },
  { id: 'ap-lordotic', title: 'Chest AP Lordotic', view: 'lordotic', image: 'lordotic', poseNote: 'ฉากจำลอง AP lordotic: โมเดลตั้งตรงและเอียงแนวลำรังสีขึ้นทางศีรษะ; มุมจริงให้ยึด protocol', note: 'เป็นภาพ AP มุมลำรังสีแบบ lordotic เพื่อประเมินบริเวณยอดปอด ไม่ใช่ภาพทรวงอกมาตรฐานแทน PA', quality: 'ตรวจว่ากระดูกไหปลาร้าไม่บังยอดปอดมากเกินไป และระบุท่าเฉพาะนี้ในภาพ', checklist: ['จัดผู้ป่วยยืนหรือนั่งหันหลังเข้าตัวรับภาพ', 'เอียงลำรังสี cephalad ตาม protocol', 'จัดบริเวณยอดปอดให้อยู่กึ่งกลางภาพ'] },
  { id: 'decubitus-left', title: 'Chest Decubitus · ตะแคงซ้าย', view: 'decubitus-left', image: 'decubitusLeft', poseNote: 'ฉากจำลองท่าตะแคงซ้าย: หมุนโมเดลทั้งร่างให้นอนตะแคงและใช้ลำรังสีแนวนอน', note: 'ผู้ป่วยนอนตะแคงซ้าย ถ่ายด้วยลำรังสีแนวนอน ใช้ดูการเคลื่อนตัวของน้ำหรืออากาศในช่องเยื่อหุ้มปอด', quality: 'คงท่าตะแคงและลำรังสีแนวนอนตามระยะเวลาที่หน่วยงานกำหนด', checklist: ['นอนตะแคงซ้ายโดยให้ด้านที่สนใจอยู่ด้านที่กำหนด', 'ใช้ลำรังสีแนวนอน', 'บันทึกด้านที่ลงและเวลาหลังจัดท่า'] },
  { id: 'decubitus-right', title: 'Chest Decubitus · ตะแคงขวา', view: 'decubitus-right', image: 'decubitusRight', poseNote: 'ฉากจำลองท่าตะแคงขวา: หมุนโมเดลทั้งร่างให้นอนตะแคงและใช้ลำรังสีแนวนอน', note: 'ผู้ป่วยนอนตะแคงขวา ถ่ายด้วยลำรังสีแนวนอน ใช้ดูการเคลื่อนตัวของน้ำหรืออากาศในช่องเยื่อหุ้มปอด', quality: 'คงท่าตะแคงและลำรังสีแนวนอนตามระยะเวลาที่หน่วยงานกำหนด', checklist: ['นอนตะแคงขวาโดยให้ด้านที่สนใจอยู่ด้านที่กำหนด', 'ใช้ลำรังสีแนวนอน', 'บันทึกด้านที่ลงและเวลาหลังจัดท่า'] }
];
let activeChestStudy = chestStudies[0];

function showPositionImage(kind) {
  const item = positioningSources[kind];
  if (!positionDiagram) return;
  positionDiagram.replaceChildren();
  if (item && !item.file) {
    const message = document.createElement('p');
    message.className = 'position-image-fallback';
    message.textContent = 'ยังไม่มีภาพสำหรับท่านี้';
    positionDiagram.append(message);
    return;
  }
  if (!item) {
    const message = document.createElement('p');
    message.textContent = 'กำลังโหลดข้อมูลภาพ…';
    positionDiagram.append(message);
    return;
  }
  const figure = document.createElement('figure');
  figure.className = 'position-figure';
  const media = document.createElement('img');
  media.src = item.file;
  media.alt = item.alt;
  media.loading = 'eager';
  const caption = document.createElement('figcaption');
  const credit = document.createElement('span');
  credit.textContent = `${item.credit} · ${item.modification || 'ไม่ดัดแปลง'}`;
  const license = document.createElement('a');
  license.href = item.license;
  license.target = '_blank';
  license.rel = 'license noreferrer';
  license.textContent = item.licenseLabel;
  caption.append(credit, document.createTextNode(' · '));
  if (item.source) {
    const source = document.createElement('a');
    source.href = item.source;
    source.target = '_blank';
    source.rel = 'noreferrer';
    source.textContent = 'แหล่งภาพ';
    caption.append(source, document.createTextNode(' · '));
  } else {
    const sourcePending = document.createElement('span');
    sourcePending.textContent = 'รอ URL แหล่งภาพ';
    caption.append(sourcePending, document.createTextNode(' · '));
  }
  caption.append(license);
  const errorBox = document.createElement('div');
  errorBox.className = 'position-image-fallback';
  errorBox.hidden = true;
  const errorText = document.createElement('span');
  errorText.textContent = 'โหลดภาพไม่สำเร็จ';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'ลองใหม่';
  retry.addEventListener('click', () => {
    errorBox.hidden = true;
    media.hidden = false;
    media.src = `${item.file}?retry=${Date.now()}`;
  });
  errorBox.append(errorText, retry);
  media.addEventListener('error', () => {
    media.hidden = true;
    errorBox.hidden = false;
  });
  figure.append(media, errorBox, caption);
  positionDiagram.append(figure);
}

function setPositionTab(kind) {
  const show3d = kind === 'pose';
  if (position3d) position3d.hidden = !show3d;
  if (positionDiagram) positionDiagram.hidden = show3d;
  byId('position-3d-note').hidden = !show3d;
  document.querySelectorAll('[data-position-tab]').forEach(button => {
    const active = button.dataset.positionTab === kind;
    button.classList.toggle('on', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (show3d) requestAnimationFrame(() => window.chestPosition3D?.resize());
  else showPositionImage(activeChestStudy.image);
}

if (positionList) {
  for (const study of chestStudies) {
    const choice = document.createElement('button');
    choice.className = 'study-choice';
    choice.textContent = study.title;
    choice.dataset.study = study.id;
    choice.addEventListener('click', () => {
      activeChestStudy = study;
      positionList.querySelectorAll('.study-choice').forEach(button => {
        const active = button.dataset.study === study.id;
        button.classList.toggle('on', active);
        if (active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
      });
      byId('position-title').textContent = study.title;
      byId('position-3d-note').textContent = study.poseNote;
      byId('position-note-title').textContent = study.title;
      byId('position-note').textContent = study.note;
      byId('position-quality').textContent = study.quality;
      const checklist = byId('position-checklist');
      checklist.replaceChildren(...study.checklist.map(text => {
        const item = document.createElement('li'); item.textContent = text; return item;
      }));
      window.chestPosition3D?.setView(study.view);
      if (document.querySelector('[data-position-tab="image"]')?.classList.contains('on')) showPositionImage(study.image);
    });
    positionList.append(choice);
  }
  const initialChoice = positionList.querySelector('[data-study="pa"]');
  initialChoice?.classList.add('on');
  initialChoice?.setAttribute('aria-current', 'true');
}
document.querySelectorAll('[data-position-tab]').forEach(button => {
  button.addEventListener('click', () => setPositionTab(button.dataset.positionTab));
});
byId('position-back')?.addEventListener('click', () => navigateToPage('atlas'));
setPositionTab('pose');
byId('position-3d-note').textContent = activeChestStudy.poseNote;
byId('position-note-title').textContent = activeChestStudy.title;
byId('position-note').textContent = activeChestStudy.note;
byId('position-quality').textContent = activeChestStudy.quality;
byId('position-checklist').replaceChildren(...activeChestStudy.checklist.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));

syncPageFromLocation();
