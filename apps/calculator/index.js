const display = document.getElementById("calcDisplay");
const standardButtons = document.getElementById("standardButtons");
const scientificButtons = document.getElementById("scientificButtons");
const toggleModeBtn = document.getElementById("toggleMode");
const calcModeLabel = document.getElementById("calcMode");

let current = "";
let isScientific = false;

function updateDisplay(val) {
  display.value = val;
}

function clearAll() {
  current = "";
  updateDisplay("");
}

function clearEntry() {
  current = current.replace(/([\d.]+|[+\-*/%^()!]+)/g, (m, p1, offset, str) => {
    if (offset + m.length === str.length) return "";
    return m;
  });
  updateDisplay(current);
}

function backspace() {
  current = current.slice(0, -1);
  updateDisplay(current);
}

function insert(val) {
  current += val;
  updateDisplay(current);
}

function insertScientific(func) {
  // For functions like sin, cos, etc.
  current += func + "(";
  updateDisplay(current);
}

function insertConstant(constant) {
  if (constant === "π") current += Math.PI;
  else if (constant === "e") current += Math.E;
  updateDisplay(current);
}

function insertPower(type) {
  if (type === "x²") current += "**2";
  else if (type === "xʸ") current += "**";
  updateDisplay(current);
}

function insertSqrt() {
  current += "sqrt(";
  updateDisplay(current);
}

function insertAbs() {
  current += "abs(";
  updateDisplay(current);
}

function insertFactorial() {
  current += "!";
  updateDisplay(current);
}

function insertInverse() {
  current += "1/";
  updateDisplay(current);
}

function safeEval(expr) {
  // Replace scientific functions with Math equivalents
  let safe = expr
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/π/g, Math.PI)
    .replace(/e/g, Math.E)
    .replace(/([\d.]+)!/g, (m, n) => `factorial(${n})`);
  // Power operator (**) is supported in modern JS
  return Function(`"use strict";return (${safe})`)();
}

function factorial(n) {
  n = Number(n);
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function calculate() {
  try {
    let result = safeEval(current);
    if (typeof result === "number" && !isNaN(result)) {
      current = result.toString();
      updateDisplay(current);
    } else {
      updateDisplay("Error");
      current = "";
    }
  } catch {
    updateDisplay("Error");
    current = "";
  }
}

function handleButton(val) {
  if (val === "AC") clearAll();
  else if (val === "CE") clearEntry();
  else if (val === "⌫") backspace();
  else if (val === "=") calculate();
  else if (
    [
      "+",
      "-",
      "*",
      "/",
      "%",
      ".",
      "(",
      ")",
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ].includes(val)
  )
    insert(val);
  else if (["sin", "cos", "tan", "ln", "log"].includes(val))
    insertScientific(val);
  else if (["π", "e"].includes(val)) insertConstant(val);
  else if (["x²", "xʸ"].includes(val)) insertPower(val);
  else if (val === "√") insertSqrt();
  else if (val === "|x|") insertAbs();
  else if (val === "!") insertFactorial();
  else if (val === "1/x") insertInverse();
  else if (val === "%") insert("/100");
}

function setMode(scientific) {
  isScientific = scientific;
  if (scientific) {
    standardButtons.style.display = "none";
    scientificButtons.style.display = "grid";
    calcModeLabel.textContent = "Scientific";
  } else {
    standardButtons.style.display = "grid";
    scientificButtons.style.display = "none";
    calcModeLabel.textContent = "Standard";
  }
  clearAll();
}

toggleModeBtn.addEventListener("click", () => {
  setMode(!isScientific);
});

// Button event listeners
[...standardButtons.querySelectorAll("button")].forEach((btn) => {
  btn.addEventListener("click", () => handleButton(btn.textContent));
});
[...scientificButtons.querySelectorAll("button")].forEach((btn) => {
  btn.addEventListener("click", () => handleButton(btn.textContent));
});

// Keyboard support
window.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === "Enter" || key === "=") calculate();
  else if (key === "Backspace") backspace();
  else if (key === "Escape") clearAll();
  else if (["+", "-", "*", "/", "%", ".", "(", ")"].includes(key)) insert(key);
  else if (/\d/.test(key)) insert(key);
});

// Helper for factorial in eval
window.factorial = factorial;

// Default mode
setMode(false);
