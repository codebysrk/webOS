// ✅ core/boot.js
function updateClock() {
  const clockElement = document.getElementById("clock");
  if (!clockElement) return;
  const now = new Date();
  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };
  const dateOptions = { month: "numeric", day: "numeric", year: "numeric" };
  clockElement.innerHTML = `
        <div class="time">${now.toLocaleTimeString("en-US", timeOptions)}</div>
        <div class="date">${now.toLocaleDateString("en-US", dateOptions)}</div>
    `;
}
setInterval(updateClock, 1000);
updateClock();
