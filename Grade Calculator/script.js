// Utilities
const $ = sel => document.querySelector(sel);
const subjectsList = document.getElementById('subjectsList');
const addRowBtn = document.getElementById('addRow');
const weightedAvgEl = document.getElementById('weightedAvg');
const letterGradeEl = document.getElementById('letterGrade');
const letterWrap = document.getElementById('letterWrap');
const totalWeightEl = document.getElementById('totalWeight');
const countSubjectsEl = document.getElementById('countSubjects');
const exportCSV = document.getElementById('exportCSV');
const clearAllBtn = document.getElementById('clearAll');
const yearEl = document.getElementById('year');
const generateExampleBtn = document.getElementById('generateExample');
const themeToggleBtn = document.getElementById('themeToggle');

yearEl.textContent = new Date().getFullYear();

// --- Theme Toggler ---
const currentTheme = localStorage.getItem('theme') || 'dark'; // Default to dark theme
document.body.classList.toggle('dark-mode', currentTheme === 'dark');
themeToggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  themeToggleBtn.animate([
    {transform: 'scale(0.9) rotate(-15deg)'},
    {transform: 'scale(1) rotate(0deg)'}
  ], {
    duration: 200,
    easing: 'ease-out'
  });
});
// --- End Theme Toggler ---


const STORAGE_KEY = 'gradeCalculatorSubjects';

function createRow(subject = {name:'', score:'', weight:''}) {
  const id = Math.random().toString(36).slice(2,9);
  const wrapper = document.createElement('div');
  wrapper.className = 'subject-row';
  wrapper.dataset.id = id;
  wrapper.innerHTML = `
    <input type="text" class="sub-name" placeholder="Subject name" value="${escapeHtml(subject.name)}" />
    <input type="number" class="sub-score" placeholder="0-100" min="0" max="100" value="${subject.score === '' ? '' : Number(subject.score)}" />
    <input type="number" class="sub-weight" placeholder="weight" min="0" value="${subject.weight === '' ? '' : Number(subject.weight)}" />
    <div class="row-actions">
      <button class="btn-icon remove" title="Remove row">×</button>
    </div>
  `;
  subjectsList.appendChild(wrapper);
  return wrapper;
}

function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// populate seed
(function init(){
  const savedSubjects = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (savedSubjects && savedSubjects.length > 0) {
    savedSubjects.forEach(s => createRow(s));
  } else {
    // Default seed rows if nothing is saved
    const seed = [
      {name: 'Mathematics', score: 92, weight: 20},
      {name: 'English', score: 88, weight: 20},
    ];
    seed.forEach(s => createRow(s));
  }
  updateSummary();
})();

// Add new empty row
addRowBtn.addEventListener('click', ()=> {
  createRow({name:'',score:'',weight:''});
  updateSummary();
});

// Event Delegation for Remove buttons
subjectsList.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove')) {
    e.target.closest('.subject-row').remove();
    updateSummary();
  }
});

// Generate Example Data
generateExampleBtn.addEventListener('click', () => {
  const subjectPool = [
    {name: 'Quantum Physics', score: 95, weight: 30},
    {name: 'Organic Chemistry', score: 88, weight: 30},
    {name: 'Advanced Calculus', score: 91, weight: 25},
    {name: 'History of Science', score: 82, weight: 15},
    {name: 'Literary Analysis', score: 85, weight: 20},
    {name: 'Microeconomics', score: 90, weight: 20},
    {name: 'Data Structures', score: 94, weight: 25},
    {name: 'Studio Art', score: 98, weight: 15},
    {name: 'Linear Algebra', score: 89, weight: 20},
    {name: 'Philosophy', score: 87, weight: 15},
  ];

  // Get 4 random subjects from the pool
  const exampleData = subjectPool.sort(() => 0.5 - Math.random()).slice(0, 4);

  // Clear current list
  subjectsList.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);

  // Populate with example data
  exampleData.forEach(subject => {
    createRow(subject);
  });

  updateSummary();
});

// Clear all
clearAllBtn.addEventListener('click', ()=>{
  subjectsList.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
  updateSummary();
  weightedAvgEl.textContent = '—';
  letterGradeEl.textContent = '—';
  letterGradeEl.className = 'letter';
});

// Calculate weighted average
function getRows(){
  return Array.from(subjectsList.querySelectorAll('.subject-row')).map(row => {
    const name = row.querySelector('.sub-name').value.trim();
    const scoreRaw = row.querySelector('.sub-score').value;
    const weightRaw = row.querySelector('.sub-weight').value;
    const score = scoreRaw === '' ? NaN : Number(scoreRaw);
    const weight = weightRaw === '' ? NaN : Number(weightRaw);
    return {name, score, weight};
  });
}

function computeWeightedAverage(rows){
  // filter invalid rows
  const valid = rows.filter(r => !Number.isNaN(r.score) && !Number.isNaN(r.weight) && r.weight > 0);
  if(valid.length === 0) return {avg:NaN, totalWeight:0};

  // Sum weights
  const totalWeight = valid.reduce((s,r)=> s + r.weight, 0);
  // If totalWeight is 0 -> treat equal weights (avoid divide by zero)
  if(totalWeight === 0){
    // simple average of scores
    const avg = valid.reduce((s,r)=> s + r.score, 0) / valid.length;
    return {avg, totalWeight:0};
  }
  // Weighted sum
  const weightedSum = valid.reduce((s,r)=> s + (r.score * r.weight), 0);
  const normalizedAvg = weightedSum / totalWeight;
  return {avg:normalizedAvg, totalWeight};
}

// Grade scale mapping (simple standard)
function mapToLetter(score){
  if(Number.isNaN(score)) return {letter:'—',className:''};
  const s = Math.round(score);
  if(s >= 90) return {letter:'A', className:'A'};
  if(s >= 80) return {letter:'B', className:'B'};
  if(s >= 70) return {letter:'C', className:'C'};
  if(s >= 60) return {letter:'D', className:'D'};
  return {letter:'F', className:'F'};
}

// UI update
function updateSummary(){
  const rows = getRows();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); // Save data on every update
  countSubjectsEl.textContent = rows.length;
  const {avg, totalWeight} = computeWeightedAverage(rows);
  totalWeightEl.textContent = (totalWeight === 0 ? '0' : Math.round(totalWeight));
  weightedAvgEl.textContent = Number.isNaN(avg) ? '—' : (Math.round(avg * 100) / 100).toFixed(2);

  const mapped = mapToLetter(avg);
  letterGradeEl.textContent = mapped.letter;
  letterGradeEl.className = mapped.letter === '—' ? 'letter' : 'letter ' + mapped.className;
}

// Recompute on any input change (debounced)
let debounceTimer;
subjectsList.addEventListener('input', ()=>{
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateSummary, 250);
});

// Export CSV
exportCSV.addEventListener('click', (e)=>{
  e.preventDefault();
  const rows = getRows();
  if(rows.length === 0){ alert('No subjects to export'); return; }
  const lines = [['Subject','Score','Weight']];
  rows.forEach(r => lines.push([r.name || '', isNaN(r.score)?'':r.score, isNaN(r.weight)?'':r.weight]));
  const csvContent = lines.map(l => l.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\\n');
  const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grades.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});