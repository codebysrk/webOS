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

// Get base path for assets
function getAssetPath(filename) {
  // Get current location to determine correct relative path
  const currentPath = window.location.pathname;
  const isInApp = currentPath.includes("/apps/");

  // Try different path strategies based on current location
  const paths = [];

  if (isInApp) {
    // If we're in an app folder, use relative paths
    paths.push(`../../assets/wallpapers/${filename}`);
    paths.push(`../assets/wallpapers/${filename}`);
  }

  // Always try absolute path
  paths.push(`/assets/wallpapers/${filename}`);

  // Fallback paths
  paths.push(`assets/wallpapers/${filename}`);

  return paths;
}

// Built-in wallpapers (with auto-detection)
let builtInWallpapers = [
  {
    name: "Default",
    filename: "bg.jpg",
    icon: "🏠",
  },
  {
    name: "Spider-Man",
    filename: "spider-man-marvel-superheroes-marvel-comics-3840x2160-7482.jpg",
    icon: "🕷️",
  },
  {
    name: "The Simpsons",
    filename: "the-simpsons-3840x2160-9411-min.png",
    icon: "🍩",
  },
];

// Wallpaper icons mapping
const wallpaperIcons = {
  "bg.jpg": "🏠",
  "spider-man": "🕷️",
  simpsons: "🍩",
  nature: "🌲",
  space: "🚀",
  anime: "🌸",
  gaming: "🎮",
  abstract: "🎨",
  minimal: "⚪",
  dark: "🌙",
  light: "☀️",
  ocean: "🌊",
  mountain: "🏔️",
  forest: "🌳",
  city: "🏙️",
  sunset: "🌅",
  sunrise: "🌄",
  night: "🌃",
  day: "🌞",
  winter: "❄️",
  summer: "☀️",
  spring: "🌸",
  autumn: "🍂",
};

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
async function init() {
  setupEventListeners();

  // Auto-detect wallpapers
  await detectWallpapers();

  // Ensure we have at least the default wallpapers
  if (builtInWallpapers.length < 3) {
    console.log("Restoring default wallpapers");
    builtInWallpapers = [
      {
        name: "Default",
        filename: "bg.jpg",
        icon: "🏠",
      },
      {
        name: "Spider-Man",
        filename:
          "spider-man-marvel-superheroes-marvel-comics-3840x2160-7482.jpg",
        icon: "🕷️",
      },
      {
        name: "The Simpsons",
        filename: "the-simpsons-3840x2160-9411-min.png",
        icon: "🍩",
      },
    ];
  }

  loadBuiltInWallpapers();

  // Store default wallpaper
  if (window.parent && window.parent.document) {
    const desktop = window.parent.document.querySelector(".desktop");
    if (desktop) {
      defaultWallpaper = desktop.style.backgroundImage;
    }
  }

  // Debug: Log current location and wallpaper paths
  console.log("Wallpaper Changer initialized");
  console.log("Current location:", window.location.href);
  console.log("Built-in wallpapers:", builtInWallpapers);
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

  // Refresh wallpapers button
  const refreshBtn = document.getElementById("refreshWallpapersBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.style.transform = "rotate(360deg)";
      refreshBtn.style.transition = "transform 0.5s ease";

      // Clear current wallpapers
      builtInWallpapers = builtInWallpapers.slice(0, 3); // Keep only default 3

      // Re-detect wallpapers
      await detectWallpapers();
      loadBuiltInWallpapers();

      showToast("Wallpapers refreshed!", "success");

      setTimeout(() => {
        refreshBtn.style.transform = "";
        refreshBtn.style.transition = "";
      }, 500);
    });
  }

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

      // Clear selection from built-in wallpapers
      document.querySelectorAll(".wallpaper-item").forEach((el) => {
        el.classList.remove("selected");
      });

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

  // Clear selection from built-in wallpapers
  document.querySelectorAll(".wallpaper-item").forEach((el) => {
    el.classList.remove("selected");
  });

  // Clear current selection
  currentImageData = null;
  currentFileName = null;
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
    // Send message to parent window to change wallpaper
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "webos-set-wallpaper",
          url: currentImageData,
        },
        "*"
      );
    }

    showToast("Wallpaper applied successfully!", "success");
    hideConfirmModal();
  }
}

function resetWallpaper() {
  // Send message to parent window to reset wallpaper
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: "webos-set-wallpaper",
        url: null, // null means reset to default
      },
      "*"
    );
  }

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

function loadBuiltInWallpapers() {
  const wallpaperGrid = document.getElementById("wallpaperGrid");
  if (!wallpaperGrid) return;

  // Show loading state
  wallpaperGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-secondary);">
      <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
      <div>Loading wallpapers...</div>
    </div>
  `;

  // Load wallpapers after a short delay to show loading state
  setTimeout(() => {
    wallpaperGrid.innerHTML = "";

    builtInWallpapers.forEach((wallpaper, index) => {
      const item = document.createElement("div");
      item.className = "wallpaper-item";
      item.setAttribute("data-wallpaper-index", index);

      item.innerHTML = `
      <div class="wallpaper-thumbnail-placeholder">⏳</div>
      <div class="wallpaper-name">${wallpaper.name}</div>
    `;

      // Try to load image with multiple path strategies
      const paths = getAssetPath(wallpaper.filename);
      let loaded = false;

      function tryLoadImage(pathIndex = 0) {
        if (pathIndex >= paths.length || loaded) {
          // All paths failed
          if (!loaded) {
            item.style.opacity = "0.5";
            const nameElement = item.querySelector(".wallpaper-name");
            if (nameElement) {
              nameElement.textContent = `${wallpaper.name} (Not Found)`;
              nameElement.style.color = "#ff6b6b";
            }
            const thumbnail = item.querySelector(
              ".wallpaper-thumbnail-placeholder"
            );
            if (thumbnail) {
              thumbnail.innerHTML = "❌";
            }
            console.warn(
              `Failed to load wallpaper: ${wallpaper.filename} - tried paths:`,
              paths
            );
          }
          return;
        }

        const img = new Image();
        img.onload = () => {
          // Image loaded successfully
          loaded = true;
          item.style.opacity = "1";
          item.classList.add("loaded");

          // Update thumbnail
          const thumbnail = item.querySelector(
            ".wallpaper-thumbnail-placeholder"
          );
          if (thumbnail) {
            thumbnail.innerHTML = `<img src="${img.src}" alt="${wallpaper.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
          }

          // Store the working URL
          wallpaper.url = img.src;
          console.log(
            `Successfully loaded wallpaper: ${wallpaper.filename} from path: ${img.src}`
          );
        };

        img.onerror = () => {
          // Try next path
          tryLoadImage(pathIndex + 1);
        };

        img.src = paths[pathIndex];
      }

      tryLoadImage();

      item.addEventListener("click", () => {
        // Check if image is available
        if (!loaded || !wallpaper.url) {
          showToast(`${wallpaper.name} image not found!`, "error");
          return;
        }

        // Remove selection from other items
        document.querySelectorAll(".wallpaper-item").forEach((el) => {
          el.classList.remove("selected");
        });

        // Select this item
        item.classList.add("selected");

        // Update preview
        const previewImg = new Image();
        previewImg.src = wallpaper.url;
        previewImg.alt = wallpaper.name;

        wallpaperPreview.innerHTML = "";
        wallpaperPreview.appendChild(previewImg);

        previewInfo.textContent = `${wallpaper.name} (Built-in)`;

        // Enable apply button
        applyBtn.disabled = false;

        // Store current selection
        currentImageData = wallpaper.url;
        currentFileName = wallpaper.name;

        showToast(`${wallpaper.name} selected!`, "success");
      });

      wallpaperGrid.appendChild(item);
    });
  }, 500); // 500ms delay to show loading state
}

// Auto-detect wallpapers from assets folder
async function detectWallpapers() {
  try {
    // Try multiple paths for directory listing
    const paths = [
      "/assets/wallpapers/",
      "../assets/wallpapers/",
      "../../assets/wallpapers/",
      "assets/wallpapers/",
    ];

    let detectedFiles = [];

    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const text = await response.text();

          // Extract image files from directory listing
          const imageExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".bmp",
          ];
          const imageFiles = [];

          // Multiple regex patterns to find image files
          const patterns = [
            /href="([^"]+\.(jpg|jpeg|png|gif|webp|bmp))"/gi,
            /href='([^']+\.(jpg|jpeg|png|gif|webp|bmp))'/gi,
            /<a[^>]*href="([^"]+\.(jpg|jpeg|png|gif|webp|bmp))"[^>]*>/gi,
            /<a[^>]*href='([^']+\.(jpg|jpeg|png|gif|webp|bmp))'[^>]*>/gi,
          ];

          for (const pattern of patterns) {
            const fileMatches = text.match(pattern);
            if (fileMatches) {
              fileMatches.forEach((match) => {
                const filename = match.match(/href=["']([^"']+)["']/)[1];
                if (
                  filename &&
                  !filename.includes("?") &&
                  !filename.includes("http")
                ) {
                  // Extract just the filename, not the full path
                  const cleanFilename = filename.split("/").pop(); // Get last part of path
                  if (cleanFilename && cleanFilename.length > 0) {
                    imageFiles.push(cleanFilename);
                  }
                }
              });
            }
          }

          if (imageFiles.length > 0) {
            detectedFiles = [...new Set(imageFiles)]; // Remove duplicates
            console.log(
              `Detected ${detectedFiles.length} wallpapers from ${path}`
            );
            break; // Use first successful path
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${path}:`, error.message);
      }
    }

    // Add detected wallpapers to the list
    detectedFiles.forEach((filename) => {
      // Check if wallpaper already exists
      const exists = builtInWallpapers.find((w) => w.filename === filename);
      if (!exists) {
        const name = generateWallpaperName(filename);
        const icon = getWallpaperIcon(filename);

        builtInWallpapers.push({
          name: name,
          filename: filename,
          icon: icon,
        });

        console.log(`Added new wallpaper: ${filename} -> ${name}`);
      }
    });

    console.log(`Total wallpapers: ${builtInWallpapers.length}`);
  } catch (error) {
    console.log(
      "Could not auto-detect wallpapers, using default list:",
      error.message
    );
  }
}

// Generate wallpaper name from filename
function generateWallpaperName(filename) {
  // Remove extension
  let name = filename.replace(/\.(jpg|jpeg|png|gif|webp|bmp)$/i, "");

  // Replace common patterns
  name = name.replace(/[-_]/g, " ");
  name = name.replace(/\d+x\d+/g, ""); // Remove resolution
  name = name.replace(/\d+/g, ""); // Remove numbers
  name = name.replace(/\s+/g, " ").trim(); // Clean up spaces

  // Capitalize first letter of each word
  name = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  // If name is empty or too short, use filename
  if (name.length < 2) {
    name = filename.replace(/\.(jpg|jpeg|png|gif|webp|bmp)$/i, "");
  }

  return name || "Wallpaper";
}

// Get icon for wallpaper based on filename
function getWallpaperIcon(filename) {
  const lowerFilename = filename.toLowerCase();

  // Check for specific keywords
  for (const [keyword, icon] of Object.entries(wallpaperIcons)) {
    if (lowerFilename.includes(keyword)) {
      return icon;
    }
  }

  // Default icons based on file type
  if (
    lowerFilename.includes("nature") ||
    lowerFilename.includes("forest") ||
    lowerFilename.includes("tree")
  ) {
    return "🌲";
  } else if (
    lowerFilename.includes("space") ||
    lowerFilename.includes("galaxy") ||
    lowerFilename.includes("star")
  ) {
    return "🚀";
  } else if (
    lowerFilename.includes("anime") ||
    lowerFilename.includes("cartoon")
  ) {
    return "🌸";
  } else if (
    lowerFilename.includes("game") ||
    lowerFilename.includes("gaming")
  ) {
    return "🎮";
  } else if (
    lowerFilename.includes("abstract") ||
    lowerFilename.includes("art")
  ) {
    return "🎨";
  } else if (
    lowerFilename.includes("minimal") ||
    lowerFilename.includes("simple")
  ) {
    return "⚪";
  } else if (
    lowerFilename.includes("dark") ||
    lowerFilename.includes("night")
  ) {
    return "🌙";
  } else if (lowerFilename.includes("light") || lowerFilename.includes("day")) {
    return "☀️";
  } else if (
    lowerFilename.includes("ocean") ||
    lowerFilename.includes("sea") ||
    lowerFilename.includes("water")
  ) {
    return "🌊";
  } else if (
    lowerFilename.includes("mountain") ||
    lowerFilename.includes("hill")
  ) {
    return "🏔️";
  } else if (
    lowerFilename.includes("city") ||
    lowerFilename.includes("urban")
  ) {
    return "🏙️";
  } else if (
    lowerFilename.includes("sunset") ||
    lowerFilename.includes("dusk")
  ) {
    return "🌅";
  } else if (
    lowerFilename.includes("sunrise") ||
    lowerFilename.includes("dawn")
  ) {
    return "🌄";
  }

  // Default icon
  return "🖼️";
}

// Initialize app
init();
