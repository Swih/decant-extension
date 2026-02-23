import { applyI18n } from '../utils/i18n-apply.js';

applyI18n();

const steps = document.querySelectorAll('.step');
const dots = document.querySelectorAll('.dot');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const msg = (key) => chrome.i18n?.getMessage(key) || key;
let current = 0;

function goTo(index) {
  steps.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  current = index;
  nextBtn.textContent = current === steps.length - 1 ? msg('btnLetsGo') : msg('btnNext');
}

nextBtn.addEventListener('click', () => {
  if (current < steps.length - 1) {
    goTo(current + 1);
  } else {
    window.close();
  }
});

skipBtn.addEventListener('click', () => window.close());
