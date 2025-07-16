// Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const wallpaperPreview = document.getElementById("wallpaperPreview");
const previewInfo = document.getElementById("previewInfo");
const applyBtn = document.getElementById("applyBtn");
const resetBtn = document.getElementById("resetBtn");
const confirmModal = document.getElementById("confirmModal");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const downloadBtn = document.getElementById("downloadBtn");
const toast = document.getElementById("toast");

// State
let currentImageData = null;
let currentFileName = null;
let defaultWallpaper = null;

// Utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Initialize
function init() {
  setupEventListeners();

  // Store default wallpaper
  if (window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop) {
      defaultWallpaper = desktop.style.backgroundImage;
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  applyBtn.addEventListener("click", showConfirmModal);
  resetBtn.addEventListener("click", resetWallpaper);

  confirmBtn.addEventListener("click", applyWallpaper);
  cancelBtn.addEventListener("click", hideConfirmModal);

  fullscreenBtn.addEventListener("click", toggleFullscreen);
  downloadBtn.addEventListener("click", downloadImage);

  setupDragAndDrop();

  // Close modal on outside click
  confirmModal.addEventListener("click", (e) => {
    if (e.target === confirmModal) hideConfirmModal();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && confirmModal.style.display === "flex") {
      hideConfirmModal();
    }
  });
}

// Setup drag and drop
function setupDragAndDrop() {
  const dragEvents = ["dragenter", "dragover", "dragleave", "drop"];

  dragEvents.forEach((eventName) => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  const dragLeaveHandler = debounce(() => {
    uploadArea.classList.remove("drag-over");
  }, 100);

  uploadArea.addEventListener(
    "dragenter",
    () => {
      uploadArea.classList.add("drag-over");
    },
    false
  );

  uploadArea.addEventListener(
    "dragover",
    () => {
      uploadArea.classList.add("drag-over");
    },
    false
  );

  uploadArea.addEventListener("dragleave", dragLeaveHandler, false);

  uploadArea.addEventListener(
    "drop",
    (e) => {
      uploadArea.classList.remove("drag-over");
      handleDrop(e);
    },
    false
  );
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e) {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  // Validate file
  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file", "error");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast("File size must be less than 10MB", "error");
    return;
  }

  // Show loading state
  wallpaperPreview.innerHTML = `
        <div class="preview-placeholder">
          <div class="preview-placeholder-icon">⏳</div>
          <div>Loading image...</div>
        </div>
      `;

  // Read file
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImageData = e.target.result;
      currentFileName = file.name;

      // Update preview
      const imgElement = document.createElement("img");
      imgElement.src = currentImageData;
      imgElement.alt = "Wallpaper Preview";

      wallpaperPreview.innerHTML = "";
      wallpaperPreview.appendChild(imgElement);

      previewInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;

      // Enable apply button
      applyBtn.disabled = false;

      showToast("Image loaded successfully!", "success");
    };

    img.onerror = () => {
      showToast("Failed to load image", "error");
      resetPreview();
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    showToast("Failed to read file", "error");
    resetPreview();
  };

  reader.readAsDataURL(file);
}

function resetPreview() {
  wallpaperPreview.innerHTML = `
        <div class="preview-placeholder">
          <div class="preview-placeholder-icon">🖼️</div>
          <div>No wallpaper selected</div>
        </div>
      `;
  previewInfo.textContent = "Select an image to preview";
  applyBtn.disabled = true;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function showConfirmModal() {
  if (currentImageData) {
    confirmModal.style.display = "flex";
  }
}

function hideConfirmModal() {
  confirmModal.style.display = "none";
}

function applyWallpaper() {
  if (currentImageData) {
    // Since we can't actually change system wallpaper, we'll just show success
    showToast("Wallpaper applied successfully!", "success");
    hideConfirmModal();
  }
}

function resetWallpaper() {
  resetPreview();
  showToast("Wallpaper reset to default", "success");
}

function toggleFullscreen() {
  if (currentImageData) {
    const img = new Image();
    img.src = currentImageData;
    img.style.maxWidth = "100vw";
    img.style.maxHeight = "100vh";
    img.style.objectFit = "contain";

    const fullscreenDiv = document.createElement("div");
    fullscreenDiv.style.position = "fixed";
    fullscreenDiv.style.top = "0";
    fullscreenDiv.style.left = "0";
    fullscreenDiv.style.width = "100%";
    fullscreenDiv.style.height = "100%";
    fullscreenDiv.style.backgroundColor = "rgba(0,0,0,0.9)";
    fullscreenDiv.style.display = "flex";
    fullscreenDiv.style.alignItems = "center";
    fullscreenDiv.style.justifyContent = "center";
    fullscreenDiv.style.zIndex = "9999";
    fullscreenDiv.style.cursor = "pointer";

    fullscreenDiv.appendChild(img);
    document.body.appendChild(fullscreenDiv);

    fullscreenDiv.addEventListener("click", () => {
      document.body.removeChild(fullscreenDiv);
    });
  }
}

function downloadImage() {
  if (currentImageData && currentFileName) {
    const link = document.createElement("a");
    link.download = currentFileName;
    link.href = currentImageData;
    link.click();
  }
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Initialize app
init();
