// ✅ core/taskbar.js
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
const overlay = document.getElementById("overlay");
const clockElement = document.getElementById("clock");
const notificationPanel = document.getElementById("notificationPanel");

startButton?.addEventListener("click", () => {
  const isOpen = startMenu.classList.contains("open");
  if (isOpen) closeStartMenu();
  else openStartMenu();
});

function openStartMenu() {
  window.closeNotificationPanel && window.closeNotificationPanel();
  startMenu.classList.add("open");
  overlay.classList.add("active");
  startMenu.style.zIndex = 99999;
}
window.openStartMenu = openStartMenu;

function closeStartMenu() {
  startMenu.classList.remove("open");
  overlay.classList.remove("active");
  // Also close notification panel if open
  if (notificationPanel.classList.contains("open")) {
    closeNotificationPanel();
  }
  startMenu.style.zIndex = 2000;
}
window.closeStartMenu = closeStartMenu;

clockElement?.addEventListener("click", () => {
  const isOpen = notificationPanel.classList.contains("open");
  if (isOpen) closeNotificationPanel();
  else openNotificationPanel();
});

function openNotificationPanel() {
  // Do NOT close start menu here
  notificationPanel.classList.add("open");
  overlay.classList.add("active");
  notificationPanel.style.zIndex = 100000;
}

function closeNotificationPanel() {
  notificationPanel.classList.remove("open");
  overlay.classList.remove("active");
  notificationPanel.style.zIndex = 2000;
}
window.closeNotificationPanel = closeNotificationPanel;

overlay?.addEventListener("click", () => {
  closeNotificationPanel();
  closeStartMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeNotificationPanel();
    closeStartMenu();
  }
});
