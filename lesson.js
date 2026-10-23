const DATA_URL = new URL('./lessons/modality-intro.json', import.meta.url);
const STORAGE_KEY = 'radiotomy.learning.modality.v1';
const byId = id => document.getElementById(id);
const content = byId('learning-content');
const feedback = byId('learning-feedback');
const source = byId('learning-source');
const reviewStatus = byId('learning-review-status');
const stepProgress = byId('learning-step-progress');
const stepText = byId('learning-step-text');
const progressDetail = byId('learning-progress-detail');
const questionText = byId('learning-question-text');
const previousButton = byId('learning-previous');
const nextButton = byId('learning-next');
let lesson;
let cardToFocus = null;

const freshState = () => ({
  currentStepId: 'objectives',
  questionIndex: 0,
  answers: {},
  completedSteps: []
});
let state = readState();

function readState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return freshState();
    const validStepIds = new Set(['objectives', 'cards', 'questions', 'review']);
    return {
      currentStepId: validStepIds.has(saved.currentStepId) ? saved.currentStepId : 'objectives',
      questionIndex: Number.isInteger(saved.questionIndex) && saved.questionIndex >= 0 ? saved.questionIndex : 0,
      answers: saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers) ? saved.answers : {},
      completedSteps: Array.isArray(saved.completedSteps) ? saved.completedSteps.filter(id => validStepIds.has(id)) : []
    };
  } catch {
    return freshState();
  }
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The lesson remains usable when browser storage is disabled or full.
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setCompleted(stepId) {
  if (!state.completedSteps.includes(stepId)) state.completedSteps.push(stepId);
}

function currentStepIndex() {
  return Math.max(0, lesson.steps.findIndex(step => step.id === state.currentStepId));
}

function statusLabel(value) {
  if (value === 'pending-instructor') return 'รอผู้สอนทวน';
  if (value === 'reviewed') return 'ผู้สอนทวนแล้ว';
  return 'ยังไม่ระบุสถานะ';
}

function renderSteps() {
  const list = byId('learning-steps');
  list.replaceChildren();
  lesson.steps.forEach((step, index) => {
    const button = element('button', 'learning-step');
    button.type = 'button';
    button.dataset.stepId = step.id;
    button.setAttribute('aria-current', step.id === state.currentStepId ? 'step' : 'false');
    const number = element('span', 'learning-step-number', String(index + 1));
    const text = element('span', 'learning-step-copy');
    text.append(element('strong', '', step.title), element('small', '', step.description));
    button.append(number, text);
    if (state.completedSteps.includes(step.id)) button.append(element('span', 'learning-step-done', 'เสร็จแล้ว'));
    button.addEventListener('click', () => {
      if (step.id !== state.currentStepId) {
        setStep(step.id);
      }
    });
    list.append(button);
  });
  const stepNumber = currentStepIndex() + 1;
  const answeredCount = lesson.questions.filter(question => answerFor(question)).length;
  const allQuestionsAnswered = answeredCount === lesson.questions.length;
  const completed = new Set(state.completedSteps);
  if (allQuestionsAnswered) completed.add('questions');
  if (!allQuestionsAnswered) completed.delete('questions');
  if (allQuestionsAnswered && state.currentStepId === 'review') completed.add('review');
  if (!allQuestionsAnswered) completed.delete('review');
  const completedCount = lesson.steps.filter(step => completed.has(step.id)).length;
  const questionProgress = allQuestionsAnswered ? 0 : answeredCount / lesson.questions.length;
  stepProgress.max = lesson.steps.length;
  stepProgress.value = completedCount + questionProgress;
  stepText.textContent = `ขั้นที่ ${stepNumber} จาก ${lesson.steps.length}`;
  progressDetail.textContent = `เสร็จ ${completedCount} จาก ${lesson.steps.length} ขั้น · ตอบแล้ว ${answeredCount} จาก ${lesson.questions.length} ข้อ`;
}

function renderObjectives() {
  content.append(element('h2', '', 'เป้าหมายของบท'));
  content.append(element('p', 'learning-lead', 'บทนี้ช่วยให้เริ่มแยก modality จากหลักการสร้างภาพและชนิดข้อมูลที่ได้ ก่อนนำความรู้ไปเรียนหัวข้อเฉพาะทางต่อ'));
  const list = element('ul', 'learning-objectives');
  lesson.objectives.forEach(objective => list.append(element('li', '', objective)));
  content.append(list);
  content.append(element('p', 'learning-note', 'เนื้อหาเป็นบทนำเพื่อการเรียนรู้ การเลือกตรวจจริงต้องเป็นไปตามคำสั่งตรวจ แนวทางของผู้สอน และ protocol ของหน่วยงาน'));
  content.append(continueButton('ไปการ์ดสรุป', 'cards'));
}

function renderCards() {
  content.append(element('h2', '', 'การ์ดสรุป 4 modality'));
  content.append(element('p', 'learning-lead', 'เลือกจำแนกจากแหล่งสัญญาณที่ใช้และลักษณะข้อมูลที่ได้'));
  const grid = element('div', 'learning-card-grid');
  lesson.cards.forEach(card => {
    const article = element('article', 'card learning-modality-card');
    article.id = `learning-card-${card.id}`;
    article.tabIndex = -1;
    article.dataset.cardId = card.id;
    article.append(element('h3', '', card.label));
    const fields = [
      ['หลักการสร้างภาพ', card.principle],
      ['ข้อมูลที่ได้', card.whatItShows],
      ['ตัวอย่าง', card.examples],
      ['รังสี', card.radiation]
    ];
    fields.forEach(([label, value]) => {
      const row = element('p', 'learning-card-row');
      row.append(element('strong', '', `${label}: `), document.createTextNode(value));
      article.append(row);
    });
    grid.append(article);
  });
  content.append(grid);
  content.append(continueButton('ไปทำคำถาม', 'questions'));
}

function continueButton(label, stepId) {
  const button = element('button', 'primary learning-continue', label);
  button.type = 'button';
  button.addEventListener('click', () => setStep(stepId));
  return button;
}

function answerFor(question) {
  const answer = state.answers[question.id];
  if (!answer || typeof answer.optionId !== 'string') return null;
  const option = question.options.find(item => item.id === answer.optionId);
  return option ? { ...answer, option } : null;
}

function renderQuestion() {
  const question = lesson.questions[state.questionIndex];
  questionText.hidden = false;
  questionText.textContent = `คำถามที่ ${state.questionIndex + 1} จาก ${lesson.questions.length}`;
  content.append(element('h2', '', 'จับคู่กับการตรวจ'));
  content.append(element('p', 'learning-scenario', question.scenario));
  const fieldset = element('fieldset', 'learning-options');
  fieldset.append(element('legend', '', 'เลือก modality ที่ตรงกับสถานการณ์'));
  const currentAnswer = answerFor(question);
  question.options.forEach(option => {
    const label = element('label', 'learning-option');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `answer-${question.id}`;
    input.value = option.id;
    input.checked = currentAnswer?.optionId === option.id;
    input.addEventListener('change', () => recordAnswer(question, option));
    const copy = element('span', 'learning-option-copy');
    copy.append(element('strong', '', option.label), element('small', '', option.hint));
    label.append(input, copy);
    fieldset.append(label);
  });
  content.append(fieldset);
  const controls = element('div', 'learning-question-controls');
  previousButton.disabled = state.questionIndex === 0;
  nextButton.textContent = state.questionIndex === lesson.questions.length - 1 ? 'สรุปและทบทวน' : 'ข้อถัดไป';
  controls.append(previousButton, nextButton);
  content.append(controls);
  renderFeedback(question);
}

function renderFeedback(question) {
  const answer = answerFor(question);
  feedback.replaceChildren();
  if (!answer) {
    feedback.append(element('p', '', 'เลือกคำตอบเพื่อดูผลและเหตุผลประกอบ'));
  } else {
    const correct = answer.optionId === question.correctOptionId;
    feedback.append(element('p', correct ? 'learning-result' : 'learning-result', correct ? 'ผลการตอบ: ถูกต้อง' : 'ผลการตอบ: ยังไม่ถูก'));
    if (!correct && question.wrongFeedback?.[answer.optionId]) {
      feedback.append(element('p', '', question.wrongFeedback[answer.optionId]));
    }
    feedback.append(element('p', '', question.explanation));
  }
  byId('learning-card-link').hidden = false;
  byId('learning-card-link').textContent = `เปิดการ์ดสรุป: ${lesson.cards.find(card => card.id === question.cardId)?.label || 'modality'}`;
  source.textContent = question.source;
  reviewStatus.textContent = statusLabel(question.reviewStatus);
  reviewStatus.dataset.status = question.reviewStatus;
}

function recordAnswer(question, option) {
  state.answers[question.id] = {
    optionId: option.id,
    isCorrect: option.id === question.correctOptionId
  };
  if (lesson.questions.every(item => answerFor(item))) setCompleted('questions');
  saveState();
  renderFeedback(question);
  renderSteps();
}

function renderReview() {
  content.append(element('h2', '', 'สรุปและทบทวน'));
  const answered = lesson.questions.filter(question => answerFor(question));
  const correct = answered.filter(question => answerFor(question).optionId === question.correctOptionId).length;
  content.append(element('p', answered.length
    ? 'learning-review-score'
    : 'learning-lead', answered.length
    ? `ตอบแล้ว ${answered.length} จาก ${lesson.questions.length} ข้อ · ถูก ${correct} ข้อ`
    : 'ยังไม่ได้เริ่มจับคู่ เริ่มที่ข้อ 1 ได้เลย'));
  content.append(element('p', 'learning-lead', 'เลือกข้อด้านล่างเพื่อกลับไปดูคำตอบและเหตุผล หรือเปิดการ์ดสรุปที่เกี่ยวข้อง'));
  const list = element('ol', 'learning-review-list');
  lesson.questions.forEach((question, index) => {
    const answer = answerFor(question);
    const row = element('li', 'learning-review-item');
    const summary = answer
      ? `ข้อ ${index + 1}: ${answer.option.label} · ${answer.optionId === question.correctOptionId ? 'ถูกต้อง' : 'ทบทวนอีกครั้ง'}`
      : `ข้อ ${index + 1}: ยังไม่ได้ตอบ`;
    row.append(element('span', '', summary));
    const button = element('button', '', answer ? 'กลับไปดู' : 'ไปตอบข้อนี้');
    button.type = 'button';
    button.addEventListener('click', () => {
      state.questionIndex = index;
      state.currentStepId = 'questions';
      saveState();
      render();
    });
    row.append(button);
    list.append(row);
  });
  content.append(list);
}

function renderRightPanel() {
  if (state.currentStepId === 'questions') {
    renderFeedback(lesson.questions[state.questionIndex]);
    return;
  }
  byId('learning-card-link').hidden = true;
  feedback.replaceChildren();
  if (state.currentStepId === 'objectives') {
    feedback.append(element('p', '', 'เริ่มจากเป้าหมายของบท แล้วไปอ่านการ์ดสรุปก่อนทำคำถาม'));
  } else if (state.currentStepId === 'cards') {
    feedback.append(element('p', '', 'หลังอ่านการ์ดทั้ง 4 ใบแล้ว ไปขั้นจับคู่เพื่อฝึกแยก modality'));
  } else {
    const pending = lesson.questions.filter(question => question.reviewStatus === 'pending-instructor').length;
    feedback.append(element('p', '', `มี ${pending} ข้อที่รอผู้สอนทวน`));
  }
  source.textContent = state.currentStepId === 'review'
    ? 'สรุปผลจากคำตอบที่บันทึกในเบราว์เซอร์นี้'
    : 'เนื้อหาในบทนี้เรียบเรียงใหม่จากหลักการทั่วไป และรอผู้สอนตรวจทาน';
  const dataStatus = lesson.questions.find(question => question.reviewStatus === 'pending-instructor')?.reviewStatus
    || lesson.questions[0]?.reviewStatus;
  reviewStatus.textContent = statusLabel(dataStatus);
  reviewStatus.dataset.status = dataStatus || 'pending-instructor';
}

function render() {
  renderSteps();
  content.replaceChildren();
  questionText.hidden = state.currentStepId !== 'questions';
  previousButton.hidden = state.currentStepId !== 'questions';
  nextButton.hidden = state.currentStepId !== 'questions';
  if (state.currentStepId === 'objectives') renderObjectives();
  else if (state.currentStepId === 'cards') renderCards();
  else if (state.currentStepId === 'questions') renderQuestion();
  else renderReview();
  renderRightPanel();
  if (cardToFocus) {
    const target = byId(`learning-card-${cardToFocus}`);
    cardToFocus = null;
    requestAnimationFrame(() => {
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      target?.focus({ preventScroll: true });
    });
  }
}

function setStep(stepId) {
  const current = state.currentStepId;
  if (current === 'review' && lesson.questions.every(question => answerFor(question))) setCompleted('review');
  if (current === 'objectives' && stepId !== 'objectives') setCompleted('objectives');
  if (current === 'cards' && stepId !== 'cards') setCompleted('cards');
  if (current === 'questions' && stepId === 'review' && lesson.questions.every(question => answerFor(question))) {
    setCompleted('questions');
  }
  if (stepId === 'review' && lesson.questions.every(question => answerFor(question))) setCompleted('review');
  state.currentStepId = stepId;
  saveState();
  render();
}

previousButton.addEventListener('click', () => {
  if (state.questionIndex > 0) {
    state.questionIndex--;
    saveState();
    render();
  }
});

nextButton.addEventListener('click', () => {
  if (state.questionIndex < lesson.questions.length - 1) {
    state.questionIndex++;
    saveState();
    render();
  } else {
    setStep('review');
  }
});

byId('learning-card-link').addEventListener('click', () => {
  const question = lesson.questions[state.questionIndex];
  cardToFocus = question.cardId;
  setStep('cards');
});

fetch(DATA_URL)
  .then(response => {
    if (!response.ok) throw new Error(`Lesson data request failed (${response.status})`);
    return response.json();
  })
  .then(data => {
    lesson = data;
    state.questionIndex = Math.min(state.questionIndex, lesson.questions.length - 1);
    state.completedSteps = state.completedSteps.filter(id => lesson.steps.some(step => step.id === id));
    render();
  })
  .catch(() => {
    content.replaceChildren(element('h2', '', 'เปิดบทเรียนไม่สำเร็จ'), element('p', '', 'โหลดข้อมูลบทเรียนไม่ได้ ลองรีเฟรชหน้าอีกครั้ง'));
    feedback.replaceChildren(element('p', '', 'ไม่สามารถแสดง feedback ได้จนกว่าจะโหลดข้อมูลบทเรียนสำเร็จ'));
  });
