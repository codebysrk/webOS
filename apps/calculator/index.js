const display = document.getElementById("calcDisplay");
const buttons = document.querySelectorAll(".calc-buttons button");
let current = "";

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = btn.textContent;
    if (val === "=") {
      try {
        current = eval(current).toString();
      } catch {
        current = "Error";
      }
      display.value = current;
    } else if (val === "C") {
      current = "";
      display.value = "";
    } else {
      current += val;
      display.value = current;
    }
  });
});
