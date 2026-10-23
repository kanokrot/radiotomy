import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const $ = s => document.querySelector(s);
const j = async u => { try { const r = await fetch(u); return r.ok ? r.json() : null } catch { return null } };
const cfg = await j('layers.json'), info = (await j('info.json')) || {};
const wrap = $('#view'), msg = $('#msg');

const R = new THREE.WebGLRenderer({antialias: true, alpha: true});
R.setPixelRatio(Math.min(devicePixelRatio, 2));
wrap.append(R.domElement);
const S = new THREE.Scene(), C = new THREE.PerspectiveCamera(34, 1, .01, 100);
S.add(new THREE.HemisphereLight(0xfff7ed, 0x596274, 1.45));
const keyLight = new THREE.DirectionalLight(0xfff2df, 2.0);
const rimLight = new THREE.DirectionalLight(0xdce8ff, .75);
S.add(keyLight, rimLight);
const pmrem = new THREE.PMREMGenerator(R);
const environment = pmrem.fromScene(new RoomEnvironment(), .03).texture;
S.environment = environment;
pmrem.dispose();
const ctl = new OrbitControls(C, R.domElement); ctl.enableDamping = true;

const other = {id: 'other', label: 'ยังไม่ทราบหมวด', color: '#9aa7b4', on: false};
const state = {on: {}, sel: null, iso: false, term: '', dim: .25, skinOpacity: .35};
const parts = [], unmatched = [];
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const models = {
  male: {label: 'ร่างกายชาย', url: cfg.model, layers: cfg.layers},
  female: {label: 'ร่างกายหญิง', url: 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb', layers: cfg.layers}
};
let activeRoot = null, loadId = 0, activeModelId = 'male';
const devMode = new URLSearchParams(location.search).has('dev');
const femaleBytes = 211624968;
const pregnancyMeshes = new Set(['VH_F_basal_plate','VH_F_chorionic_plate','VH_F_placenta_vessels','VH_F_amnion','VH_F_umbilical_cord','VH_F_umbilical_artery_1','VH_F_umbilical_artery_2','VH_F_umbilical_vein']);
function showLoadStatus(text, percent = null) {
  msg.hidden = !text;
  msg.replaceChildren();
  const box = document.createElement('div'); box.className = 'load-status';
  const label = document.createElement('div'); label.textContent = text; box.append(label);
  if (percent !== null) { const progress = document.createElement('progress'); progress.max = 100; progress.value = percent; box.append(progress); }
  msg.append(box);
}

const organColors = [
  [/liver|hepatic|hepatovenous/i, '#704039'], [/lung|bronch/i, '#c98f99'],
  [/kidney|renal|ureter/i, '#92504b'], [/heart|atrium|ventricle|aortic valve|mitral valve|tricuspid valve/i, '#8d3b40'],
  [/stomach|esophag/i, '#b87b6f'], [/intestin|duodenum|jejunum|ileum|colon|appendix|rectum/i, '#c1967a'],
  [/pancrea/i, '#b58975'], [/spleen/i, '#8e5354'], [/bladder/i, '#a77975'],
  [/brain|cerebr|gyrus|cerebell|medulla|hippocamp|pons|pituitary|hypothalam/i, '#bd8d87'],
  [/uter|ovary|ovari|prostate|mammary|breast/i, '#a96f72'], [/adrenal|thyroid|thymus|gland/i, '#ad8971']
];
function pretty(n) { return n.replace(/^(VH_[MF]_)/i, '').replace(/_/g, ' ').replace(/\s*\d+$/, '') }
function materialList(material) { return Array.isArray(material) ? material : [material] }
function setLayerMaterial(object, layer) {
  const color = layer.id === 'organ'
    ? (organColors.find(([re]) => re.test(object.name))?.[1] || layer.color)
    : layer.color;
  object.material = Array.isArray(object.material) ? object.material.map(m => m.clone()) : object.material.clone();
  for (const material of materialList(object.material)) {
    material.color.set(color);
    if (layer.id === 'skin') material.vertexColors = false;
    if (material.isMeshStandardMaterial) {
      material.roughness = layer.id === 'skin' ? .78 : layer.id === 'bone' ? .72 : .76;
      material.metalness = 0;
    }
    material.userData.atlasBaseOpacity = material.opacity;
    material.userData.atlasBaseTransparent = material.transparent;
    material.userData.atlasBaseDepthWrite = material.depthWrite;
  }
}

function loadModel(id) {
  const model = models[id], thisLoad = ++loadId;
  window.chestPosition3D?.setAnatomy(null);
  state.sel = null;
  $('#iname').textContent = 'เลือกชิ้นส่วนในโมเดล';
  $('#idesc').textContent = 'คลิกโครงสร้างเพื่อดูชื่อและรายละเอียด';
  $('#modelSelect').disabled = true;
  showLoadStatus('Loading model...');
  if (activeRoot) {
    S.remove(activeRoot);
    activeRoot.traverse(o => { if (o.isMesh) { o.geometry.dispose(); const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => m.dispose()) } });
    activeRoot = null;
  }
  parts.length = 0; unmatched.length = 0;
  model.layers.forEach(l => { if (state.on[l.id] === undefined) state.on[l.id] = l.on });
  if (state.on.other === undefined) state.on.other = true;
  const rules = model.layers.map(l => ({...l, re: new RegExp(l.match, 'i')}));
  loader.load(model.url, g => {
  if (thisLoad !== loadId) return;
  const root = g.scene; activeRoot = root; S.add(root);
  root.traverse(o => {
    if (!o.isMesh) return;
    const searchableName = o.name.replace(/_/g, ' ');
    const r = rules.find(r => r.re.test(searchableName)) || other;
    if (r === other) unmatched.push(o.name);
    setLayerMaterial(o, r);
    o.userData.layer = pregnancyMeshes.has(o.name) ? 'dev-pregnancy' : r.id; parts.push(o);
  });
  const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const halfFov = THREE.MathUtils.degToRad(C.fov / 2);
  const d = Math.max(size.y / (2 * Math.tan(halfFov) * .91), size.x / (2 * Math.tan(halfFov) * C.aspect * .91));
  C.near = d / 100; C.far = d * 100; C.updateProjectionMatrix();
  C.position.set(ctr.x, ctr.y, ctr.z + d); ctl.target.copy(ctr);
  ctl.minDistance = d * .1; ctl.maxDistance = d * 4;
  keyLight.position.set(ctr.x - size.x, ctr.y + size.y, ctr.z + size.z * 1.5);
  rimLight.position.set(ctr.x + size.x, ctr.y + size.y * .3, ctr.z - size.z);
  showLoadStatus('');
  activeModelId = id;
  buildLayers(model.layers); apply(); $('#modelSelect').disabled = false;
  window.atlasAnatomyRoot = root;
  window.chestPosition3D?.setAnatomy(root);
  if (devMode) {
    $('#devUnmatched').hidden = false;
    window.atlasDebug = {parts, unmatched, state};
  }
  $('#un').textContent = unmatched.length; $('#unl').textContent = unmatched.join('\n');
}, xhr => {
  if (thisLoad !== loadId) return;
  const percent = xhr.total ? Math.round(xhr.loaded / xhr.total * 100) : (id === 'female' ? Math.min(99, Math.round(xhr.loaded / femaleBytes * 100)) : null);
  const suffix = id === 'female' ? ' (about 212 MB)' : '';
  showLoadStatus(`Downloading ${id === 'female' ? 'female' : 'male'} model${suffix}${percent === null ? '...' : `... ${percent}%`}`, percent);
}, () => {
  if (thisLoad !== loadId) return;
  showLoadStatus(`${id === 'female' ? 'Female' : 'Male'} model failed to load. Check your internet connection and select it again.`);
  $('#modelSelect').value = activeModelId;
  $('#modelSelect').disabled = false;
});
}

$('#modelSelect').onchange = e => {
  const id = e.target.value;
  if (id === 'female' && !window.confirm('The female model is about 212 MB. Wi-Fi is recommended. Download now?')) {
    e.target.value = activeModelId; return;
  }
  loadModel(id);
};
const pregnancyToggle = $('#showPregnancy');
if (pregnancyToggle) pregnancyToggle.onchange = e => { state.showPregnancy = e.target.checked; apply() };
loadModel('male');

function buildLayers(layers) {
  const f = $('#layers');
  f.querySelectorAll('label').forEach(n => n.remove());
  layers.forEach(l => {
    const n = parts.filter(p => p.userData.layer === l.id).length;
    if (!n) return;
    const b = document.createElement('label');
    const check = document.createElement('input'); check.type = 'checkbox';
    check.checked = state.on[l.id] ?? l.on;
    const sw = document.createElement('span'); sw.className = 'sw'; sw.style.background = l.color;
    const name = document.createElement('span'); name.dataset.id = l.id; name.textContent = l.label;
    const count = document.createElement('span'); count.className = 'layer-count'; count.textContent = n.toLocaleString('th-TH');
    b.append(check, sw, name, count);
    check.onchange = e => { state.on[l.id] = e.target.checked; apply() };
    f.append(b);
  });
}

function apply() {
  const t = state.term.toLowerCase();
  let hits = 0;
  parts.forEach(p => {
    const m = !t || p.name.toLowerCase().includes(t);
    if (t && m) hits++;
    const pregnancyVisible = p.userData.layer === 'dev-pregnancy' && devMode && state.showPregnancy;
    const layerVisible = pregnancyVisible || (p.userData.layer !== 'other' && p.userData.layer !== 'dev-pregnancy' && state.on[p.userData.layer]);
    p.visible = layerVisible && m && (!state.iso || !state.sel || p === state.sel);
    const dimmed = state.sel && p !== state.sel;
    for (const mat of materialList(p.material)) {
      const base = mat.userData.atlasBaseOpacity ?? 1;
      const opacity = p.userData.layer === 'skin' ? state.skinOpacity : base * (dimmed ? state.dim : 1);
      const baseTransparent = mat.userData.atlasBaseTransparent ?? false;
      mat.transparent = baseTransparent || opacity < 1;
      mat.opacity = opacity;
      mat.depthWrite = p.userData.layer === 'skin' || dimmed ? false : (mat.userData.atlasBaseDepthWrite ?? true);
      if (mat.emissive) mat.emissive.set(p === state.sel ? 0x252525 : 0x000000);
    }
  });
  $('#qn').textContent = t ? `พบ ${hits} ชิ้น` : '';
}

function select(p) {
  state.sel = p;
  const key = p ? p.name.toLowerCase() : '', i = info[key];
  $('#iname').textContent = p ? (i?.th || pretty(p.name)) : 'เลือกชิ้นส่วนในโมเดล';
  $('#idesc').textContent = p ? `${p.name}${i?.desc ? ` · ${i.desc}` : ''}` : 'คลิกโครงสร้างเพื่อดูชื่อและรายละเอียด';
  apply();
}

const RC = new THREE.Raycaster(); let down = null;
R.domElement.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
R.domElement.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const b = R.domElement.getBoundingClientRect();
  RC.setFromCamera(new THREE.Vector2((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height * 2 - 1)), C);
  const h = RC.intersectObjects(parts.filter(p => p.visible), false);
  if (h.length) select(h[0].object);
});

$('#q').oninput = e => { state.term = e.target.value.trim(); apply() };
$('#dim').oninput = e => { state.dim = +e.target.value; apply() };
$('#skinOpacity').oninput = e => { state.skinOpacity = +e.target.value; $('#skinOpacityValue').textContent = `ทึบ ${Math.round(state.skinOpacity * 100)}% · 0% คือใส`; apply() };
$('#iso').onclick = e => { state.iso = !state.iso; e.target.classList.toggle('on', state.iso); e.target.setAttribute('aria-pressed', state.iso); apply() };
$('#clr').onclick = () => select(null);
$('#auto').onclick = e => { ctl.autoRotate = !ctl.autoRotate; e.target.classList.toggle('on', ctl.autoRotate); e.target.setAttribute('aria-pressed', ctl.autoRotate) };

new ResizeObserver(() => { const w = wrap.clientWidth, h = wrap.clientHeight; R.setSize(w, h, false); C.aspect = w / h; C.updateProjectionMatrix() }).observe(wrap);
(function loop() { requestAnimationFrame(loop); ctl.update(); R.render(S, C) })();

if (devMode) $('#devUnmatched').hidden = false;
