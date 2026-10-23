const $ = (id) => document.getElementById(id);
const inputIds = ['bmd-value', 'bmd-mean', 'bmd-sd'];
const siteNotes = {
  spine: 'L1–L4: กระดูกงอกหรือความเสื่อมอาจทำให้ค่า BMD กระดูกสันหลังสูงเกินจริง โดยเฉพาะในผู้สูงอายุ',
  neck: 'คอกระดูกต้นขา: ใช้ค่าเฉลี่ยและ SD ของตำแหน่งคอกระดูกต้นขาจากฐานอ้างอิงที่เหมาะสม',
  hip: 'สะโพกรวม: ใช้ค่าเฉลี่ยและ SD ของตำแหน่งสะโพกรวมจากฐานอ้างอิงที่เหมาะสม'
};

// One coordinate transform governs the T-score bar, its boundaries, and the marker.
export function tScoreToPercent(score) {
  return Math.max(0, Math.min(100, ((score + 4) / 6) * 100));
}

function formatMinus(value, digits) {
  const str = Number(value).toFixed(digits);
  return str.startsWith('-') ? `−${str.slice(1)}` : str;
}

function drawScale() {
  const bands = document.querySelectorAll('#score-scale .scale-band');
  const lowBoundary = tScoreToPercent(-2.5);
  const highBoundary = tScoreToPercent(-1.0);
  bands[0].style.width = `${lowBoundary}%`;
  bands[1].style.width = `${highBoundary - lowBoundary}%`;
  bands[2].style.width = `${100 - highBoundary}%`;
  $('scale-threshold-low').style.left = `${tScoreToPercent(-2.5)}%`;
  $('scale-threshold-high').style.left = `${tScoreToPercent(-1.0)}%`;
}

function showValidation(input, message) {
  const error = $(`${input.id}-error`);
  error.textContent = message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
}

function calculate() {
  const values = inputIds.map((id) => $(id).valueAsNumber);
  const messages = ['กรุณากรอก BMD เป็นตัวเลข', 'กรุณากรอกค่าเฉลี่ยอ้างอิงเป็นตัวเลข', 'กรุณากรอก SD เป็นตัวเลข'];
  for (let i = 0; i < inputIds.length; i++) {
    const input = $(inputIds[i]);
    const value = values[i];
    let error = '';
    if (input.value.trim() === '' || !Number.isFinite(value)) error = messages[i];
    else if (i > 0 && value <= 0) error = i === 2 ? 'SD ต้องมากกว่า 0' : 'ค่าเฉลี่ยอ้างอิงต้องมากกว่า 0';
    else if (value < 0) error = 'กรุณากรอกค่าที่ไม่ติดลบ';
    showValidation(input, error);
  }

  const bmd = values[0], mean = values[1], sd = values[2];
  const mode = $('bmd-group').value;
  const isZ = mode === 'z';
  $('bmd-title').textContent = isZ ? 'Z-score จากเครื่อง DXA' : 'T-score จากเครื่อง DXA';
  $('bmd-mean-label').textContent = isZ
    ? 'ค่าเฉลี่ยอ้างอิงที่ตรงกับอายุ/เพศ/เชื้อชาติ (g/cm²)'
    : 'ค่าเฉลี่ยอ้างอิงวัยหนุ่มสาว (g/cm²)';
  $('bmd-score-mode').textContent = isZ ? 'Z-SCORE' : 'T-SCORE';
  $('bmd-result-heading').textContent = $('bmd-sites').querySelector('button.on')?.textContent || 'L1–L4';
  $('bmd-warning').textContent = Number.isFinite(bmd) && bmd > 2 ? 'คำเตือน: BMD มากกว่า 2.0 g/cm² โปรดตรวจหน่วยและค่าที่กรอก' : '';
  const invalid = inputIds.some((id) => $(id).getAttribute('aria-invalid') === 'true');
  $('bmd-result').hidden = invalid;
  $('bmd-scale-wrap').hidden = invalid || $('bmd-group').value !== 't';
  if (invalid) {
    $('bmd-label').textContent = 'รอข้อมูล';
    $('bmd-english').textContent = 'กรอกค่าเพื่อคำนวณ';
    $('bmd-metric-value').textContent = Number.isFinite(bmd) ? bmd.toFixed(3) : '—';
    $('bmd-metric-mean').textContent = Number.isFinite(mean) ? mean.toFixed(3) : '—';
    $('bmd-metric-delta').textContent = '—';
    $('bmd-metric-sd').textContent = Number.isFinite(sd) ? sd.toFixed(3) : '—';
    $('bmd-status-strip').dataset.tone = 'waiting';
    $('bmd-formula').textContent = 'กรอกค่าที่ถูกต้องทั้งสามช่องเพื่อคำนวณ';
    $('bmd-out-of-range').textContent = '';
    return;
  }

  const score = (bmd - mean) / sd;
  $('bmd-metric-value').textContent = bmd.toFixed(3);
  $('bmd-metric-mean').textContent = mean.toFixed(3);
  $('bmd-metric-delta').textContent = `${(bmd - mean >= 0 ? '+' : '−')}${Math.abs(bmd - mean).toFixed(3)}`;
  $('bmd-metric-sd').textContent = sd.toFixed(3);
  $('bmd-formula-name').textContent = `${isZ ? 'Z' : 'T'} = (BMD − ค่าเฉลี่ยอ้างอิง) ÷ SD`;
  $('bmd-score').textContent = formatMinus(score, 1);
  $('bmd-formula').textContent = `= (${bmd.toFixed(3)} − ${mean.toFixed(3)}) ÷ ${sd.toFixed(3)} = ${formatMinus(score, 3)}`;

  if (isZ) {
    const belowExpected = score <= -2 || Math.abs(score + 2) < 1e-12;
    $('bmd-label').textContent = belowExpected ? 'ต่ำกว่าช่วงที่คาดตามอายุ' : 'อยู่ในช่วงที่คาดตามอายุ';
    $('bmd-english').textContent = belowExpected ? 'Below the expected range for age' : 'Within the expected range for age';
    $('bmd-education').textContent = 'กลุ่มนี้ใช้ Z-score เทียบกับฐานอ้างอิงที่เหมาะกับอายุ เพศ และเชื้อชาติ/ชาติพันธุ์ สำหรับเด็ก ไม่ใช้ DXA เพียงอย่างเดียวในการสรุปภาวะของกระดูก และควรพิจารณาประวัติกระดูกหักร่วมด้วย';
    $('bmd-status-strip').dataset.tone = belowExpected ? 'low' : 'normal';
    $('bmd-out-of-range').textContent = '';
  } else {
    if (score <= -2.5) {
      $('bmd-label').textContent = 'เข้าเกณฑ์กระดูกพรุนตามค่า T-score';
      $('bmd-english').textContent = 'Osteoporosis range';
    } else if (score < -1) {
      $('bmd-label').textContent = 'มวลกระดูกต่ำ';
      $('bmd-english').textContent = 'Low bone mass range';
    } else {
      $('bmd-label').textContent = 'อยู่ในช่วงปกติ';
      $('bmd-english').textContent = 'Normal range';
    }
    $('bmd-status-strip').dataset.tone = score <= -2.5 ? 'osteoporosis' : score < -1 ? 'low' : 'normal';
    $('bmd-education').textContent = 'กลุ่มนี้ใช้ T-score ตามเกณฑ์ WHO/ISCD ผลจากเครื่องคำนวณนี้ใช้เรียนรู้เท่านั้น การแปลผลจริงต้องใช้รายงาน DXA และบริบททางคลินิก';
    drawScale();
    const position = tScoreToPercent(score);
    $('score-marker').style.left = `${position}%`;
    $('scale-marker-label').style.left = `${position}%`;
    $('scale-marker-label').textContent = formatMinus(score, 1);
    $('bmd-out-of-range').textContent = score < -4
      ? 'ค่าอยู่นอกสเกลด้านต่ำ (ต่ำกว่า −4); หมุดถูกจำกัดไว้ที่ปลายแถบ'
      : score > 2 ? 'ค่าอยู่นอกสเกลด้านสูง (สูงกว่า +2); หมุดถูกจำกัดไว้ที่ปลายแถบ' : '';
  }
}

if ($('bmd-group')) {
  inputIds.forEach((id) => $(id).addEventListener('input', calculate));
  $('bmd-group').addEventListener('change', calculate);
  $('bmd-sites').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-site]');
    if (!button) return;
    $('bmd-sites').querySelectorAll('button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('on', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('bmd-site-note').textContent = siteNotes[button.dataset.site];
    $('bmd-score-mode').textContent = $('bmd-group').value === 'z' ? 'Z-SCORE' : 'T-SCORE';
    $('bmd-result-heading').textContent = button.textContent;
    if ($('bmd-value').value.trim() && $('bmd-mean').value.trim() && $('bmd-sd').value.trim()) calculate();
  });
  $('bmd-reset').addEventListener('click', () => {
    inputIds.forEach((id) => { $(id).value = ''; });
    calculate();
  });
  drawScale();
}

window.bmdTScoreToPercent = tScoreToPercent;
