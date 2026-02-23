const steps = document.querySelectorAll('.step');
const dots = document.querySelectorAll('.dot');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
let current = 0;

function goTo(index) {
  steps.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  current = index;
  nextBtn.textContent = current === steps.length - 1 ? "Let's go!" : 'Next';
}

nextBtn.addEventListener('click', () => {
  if (current < steps.length - 1) {
    goTo(current + 1);
  } else {
    window.close();
  }
});

skipBtn.addEventListener('click', () => window.close());
