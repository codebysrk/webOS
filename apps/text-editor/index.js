const editor = document.getElementById("editorArea");
const saveBtn = document.getElementById("saveBtn");
const saveMsg = document.getElementById("saveMsg");

saveBtn.addEventListener("click", () => {
  saveMsg.textContent = "Saved! (Not persistent)";
  setTimeout(() => (saveMsg.textContent = ""), 1500);
});
