const input = document.getElementById("wallpaperInput");
const preview = document.getElementById("wallpaperPreview");
const setBtn = document.getElementById("setWallpaperBtn");
const resetBtn = document.getElementById("resetWallpaperBtn");
const confirmRow = document.getElementById("confirmRow");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const toast = document.getElementById("toast");

let tempWallpaper = null;
let lastWallpaper = null;
let defaultWallpaper = null;

// Helper: show toast
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// Helper: get current desktop wallpaper
function getCurrentWallpaper() {
  if (window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop) {
      const bg = desktop.style.backgroundImage;
      if (bg && bg.startsWith("url(")) {
        return bg.slice(5, -2); // remove url('...')
      }
    }
  }
  return null;
}

// On load, store default wallpaper
window.addEventListener("DOMContentLoaded", () => {
  defaultWallpaper = getCurrentWallpaper();
});

input.addEventListener("change", function () {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      preview.innerHTML = `<img src='${ev.target.result}' alt='Preview' />`;
      // Live preview on desktop
      if (window.parent && window.parent.document) {
        const desktop = window.parent.document.querySelector(".desktop");
        if (desktop) {
          lastWallpaper = desktop.style.backgroundImage;
          desktop.style.backgroundImage = `url('${ev.target.result}')`;
          desktop.style.backgroundSize = "cover";
          desktop.style.backgroundPosition = "center";
          desktop.style.backgroundRepeat = "no-repeat";
          tempWallpaper = ev.target.result;
        }
      }
      confirmRow.style.display = "flex";
      setBtn.disabled = true;
      resetBtn.disabled = true;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = "No image selected";
    tempWallpaper = null;
    confirmRow.style.display = "none";
    setBtn.disabled = false;
    resetBtn.disabled = false;
  }
});

confirmBtn.addEventListener("click", function () {
  if (tempWallpaper && window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop) {
      desktop.style.backgroundImage = `url('${tempWallpaper}')`;
      desktop.style.backgroundSize = "cover";
      desktop.style.backgroundPosition = "center";
      desktop.style.backgroundRepeat = "no-repeat";
      showToast("Wallpaper set successfully!");
    }
  }
  confirmRow.style.display = "none";
  setBtn.disabled = false;
  resetBtn.disabled = false;
  tempWallpaper = null;
});

cancelBtn.addEventListener("click", function () {
  // Revert to last wallpaper
  if (window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop && lastWallpaper !== null) {
      desktop.style.backgroundImage = lastWallpaper;
    }
  }
  preview.innerHTML = "No image selected";
  input.value = "";
  confirmRow.style.display = "none";
  setBtn.disabled = false;
  resetBtn.disabled = false;
  tempWallpaper = null;
});

setBtn.addEventListener("click", function () {
  // For accessibility: allow set without preview/confirm
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (ev) {
      if (window.parent && window.parent.document) {
        const desktop = window.parent.document.querySelector(".desktop");
        if (desktop) {
          desktop.style.backgroundImage = `url('${ev.target.result}')`;
          desktop.style.backgroundSize = "cover";
          desktop.style.backgroundPosition = "center";
          desktop.style.backgroundRepeat = "no-repeat";
          showToast("Wallpaper set successfully!");
        }
      }
    };
    reader.readAsDataURL(file);
  } else {
    showToast("Please select an image first!");
  }
});

resetBtn.addEventListener("click", function () {
  if (window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop) {
      if (defaultWallpaper) {
        desktop.style.backgroundImage = defaultWallpaper
          ? `url('${defaultWallpaper}')`
          : "";
        showToast("Wallpaper reset to default.");
      } else {
        desktop.style.backgroundImage = "";
        showToast("Wallpaper cleared.");
      }
    }
  }
  preview.innerHTML = "No image selected";
  input.value = "";
  confirmRow.style.display = "none";
  setBtn.disabled = false;
  resetBtn.disabled = false;
  tempWallpaper = null;
});
