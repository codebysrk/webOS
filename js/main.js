// js/main.js
const webOSState = {
  openAppWindows: {},
  notifications: [],
  settings: {},
};

window.addEventListener("DOMContentLoaded", async () => {
  updateClock();
  const appGrid = document.getElementById("appGrid");
  let zIndexCounter = 3000;
  const taskbarApps = document.getElementById("taskbarApps");
  const desktopIconsContainer = document.getElementById("desktopIcons");

  // Debug: Check if taskbarApps exists
  console.log("=== TASKBAR DEBUG ===");
  console.log("taskbarApps element:", taskbarApps);
  console.log("taskbarApps children:", taskbarApps?.children);
  console.log("taskbarApps innerHTML:", taskbarApps?.innerHTML);

  // --- Desktop Icons State ---
  let desktopIconPositions = {};
  function loadDesktopIconPositions() {
    try {
      const saved = localStorage.getItem("webos-desktop-icons");
      if (saved) desktopIconPositions = JSON.parse(saved);
    } catch {}
  }
  function saveDesktopIconPositions() {
    try {
      localStorage.setItem(
        "webos-desktop-icons",
        JSON.stringify(desktopIconPositions)
      );
    } catch {}
  }

  // --- Desktop File/Folder Data ---
  let desktopItems = [];
  let hiddenApps = new Set(); // Track hidden system apps

  function loadDesktopItems() {
    try {
      const saved = localStorage.getItem("webos-desktop-items");
      if (saved) desktopItems = JSON.parse(saved);
    } catch {}

    // Load hidden apps
    try {
      const savedHidden = localStorage.getItem("webos-hidden-apps");
      if (savedHidden) {
        hiddenApps = new Set(JSON.parse(savedHidden));
      } else {
        // Hide wallpaper changer by default on first load
        hiddenApps.add("apps/wallpaper-changer/index.html");
      }
    } catch {}
  }

  function saveDesktopItems() {
    try {
      localStorage.setItem("webos-desktop-items", JSON.stringify(desktopItems));
    } catch {}

    // Save hidden apps
    try {
      localStorage.setItem(
        "webos-hidden-apps",
        JSON.stringify([...hiddenApps])
      );
    } catch {}
  }

  // --- Render Desktop Icons (Apps + Files/Folders) ---
  function renderDesktopIcons(apps) {
    desktopIconsContainer.innerHTML = "";
    const gapX = 16,
      gapY = 16,
      iconW = 72,
      iconH = 80;
    let col = 0,
      row = 0,
      maxRows = Math.floor(window.innerHeight / (iconH + gapY));
    // Render app icons (only show non-hidden apps)
    apps
      .filter((app) => !hiddenApps.has(app.appPath))
      .forEach((app, i) => {
        let iconDiv = document.createElement("div");
        iconDiv.className = "desktop-icon";
        iconDiv.setAttribute("data-app-path", app.appPath);
        iconDiv.setAttribute("tabindex", "0");
        // Position
        let pos = desktopIconPositions[app.appPath];
        if (!pos) {
          pos = {
            left: 32 + col * (iconW + gapX),
            top: 32 + row * (iconH + gapY),
          };
          row++;
          if (row >= maxRows) {
            row = 0;
            col++;
          }
          desktopIconPositions[app.appPath] = pos;
        }
        iconDiv.style.left = pos.left + "px";
        iconDiv.style.top = pos.top + "px";
        // Icon image
        let iconImg = document.createElement("div");
        iconImg.className = "icon-img";
        if (app.icon && app.icon.endsWith(".png")) {
          let img = document.createElement("img");
          img.src = app.icon;
          img.alt = app.name;
          img.style.width = "100%";
          img.style.height = "100%";
          iconImg.appendChild(img);
        } else if (app.appIcon && app.appIcon.startsWith("apps/")) {
          let img = document.createElement("img");
          img.src = app.appIcon;
          img.alt = app.name;
          img.style.width = "100%";
          img.style.height = "100%";
          iconImg.appendChild(img);
        } else {
          iconImg.textContent = app.icon || app.appIcon || "📦";
        }
        iconDiv.appendChild(iconImg);
        // Label
        let label = document.createElement("div");
        label.className = "icon-label";
        label.textContent = app.name;
        iconDiv.appendChild(label);
        // Drag logic
        let isDragging = false,
          dragOffsetX = 0,
          dragOffsetY = 0;
        iconDiv.addEventListener("mousedown", function (e) {
          if (e.button !== 0) return;
          isDragging = true;
          dragOffsetX = e.clientX - iconDiv.offsetLeft;
          dragOffsetY = e.clientY - iconDiv.offsetTop;
          iconDiv.classList.add("selected");
          document.body.style.userSelect = "none";
        });
        document.addEventListener("mousemove", function (e) {
          if (!isDragging) return;
          let x = e.clientX - dragOffsetX;
          let y = e.clientY - dragOffsetY;
          x = Math.max(0, Math.min(window.innerWidth - iconW, x));
          y = Math.max(0, Math.min(window.innerHeight - iconH, y));
          iconDiv.style.left = x + "px";
          iconDiv.style.top = y + "px";
        });
        document.addEventListener("mouseup", function (e) {
          if (!isDragging) return;
          isDragging = false;
          iconDiv.classList.remove("selected");
          desktopIconPositions[app.appPath] = {
            left: parseInt(iconDiv.style.left),
            top: parseInt(iconDiv.style.top),
          };
          saveDesktopIconPositions();
          document.body.style.userSelect = "";
        });
        // Double-click to open app
        iconDiv.addEventListener("dblclick", function (e) {
          createAppWindow({
            appName: app.name,
            appIcon: iconImg.innerHTML,
            appPath: app.appPath,
          });
        });
        // Keyboard accessibility: Enter/Space to open
        iconDiv.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            createAppWindow({
              appName: app.name,
              appIcon: iconImg.innerHTML,
              appPath: app.appPath,
            });
          }
        });
        desktopIconsContainer.appendChild(iconDiv);
      });
    // Render file/folder icons
    desktopItems.forEach((item, i) => {
      let iconDiv = document.createElement("div");
      iconDiv.className = "desktop-icon";
      iconDiv.setAttribute("data-item-id", item.id);
      iconDiv.setAttribute("tabindex", "0");
      // Position
      let pos = item.pos;
      if (!pos) {
        pos = {
          left: 32 + col * (iconW + gapX),
          top: 32 + row * (iconH + gapY),
        };
        row++;
        if (row >= maxRows) {
          row = 0;
          col++;
        }
        item.pos = pos;
      }
      iconDiv.style.left = pos.left + "px";
      iconDiv.style.top = pos.top + "px";
      // Icon image
      let iconImg = document.createElement("div");
      iconImg.className = "icon-img";
      if (item.type === "file") {
        iconImg.textContent = "📄";
      } else if (item.type === "folder") {
        iconImg.textContent = "📁";
      }
      iconDiv.appendChild(iconImg);
      // Label
      let label = document.createElement("div");
      label.className = "icon-label";
      label.textContent = item.name;
      iconDiv.appendChild(label);
      // Drag logic
      let isDragging = false,
        dragOffsetX = 0,
        dragOffsetY = 0;
      iconDiv.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        isDragging = true;
        dragOffsetX = e.clientX - iconDiv.offsetLeft;
        dragOffsetY = e.clientY - iconDiv.offsetTop;
        iconDiv.classList.add("selected");
        document.body.style.userSelect = "none";
      });
      document.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        let x = e.clientX - dragOffsetX;
        let y = e.clientY - dragOffsetY;
        x = Math.max(0, Math.min(window.innerWidth - iconW, x));
        y = Math.max(0, Math.min(window.innerHeight - iconH, y));
        iconDiv.style.left = x + "px";
        iconDiv.style.top = y + "px";
      });
      document.addEventListener("mouseup", function (e) {
        if (!isDragging) return;
        isDragging = false;
        iconDiv.classList.remove("selected");
        item.pos = {
          left: parseInt(iconDiv.style.left),
          top: parseInt(iconDiv.style.top),
        };
        saveDesktopItems();
        document.body.style.userSelect = "";
      });
      // Double-click to open file/folder
      iconDiv.addEventListener("dblclick", function (e) {
        if (item.type === "file") {
          alert("File: " + item.name);
        } else if (item.type === "folder") {
          alert("Folder: " + item.name);
        }
      });
      // Keyboard accessibility
      iconDiv.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          if (item.type === "file") {
            alert("File: " + item.name);
          } else if (item.type === "folder") {
            alert("Folder: " + item.name);
          }
        }
      });
      desktopIconsContainer.appendChild(iconDiv);
    });
    saveDesktopIconPositions();
    saveDesktopItems();
  }

  function setActiveTaskbarIcon(appPath) {
    Array.from(taskbarApps.children).forEach((btn) => {
      if (btn.dataset.appPath === appPath) {
        btn.classList.add("active");
        // Check if all windows are minimized
        const windows = webOSState.openAppWindows[appPath];
        if (windows && windows.every((win) => win.style.display === "none")) {
          btn.classList.remove("active");
          btn.classList.add("minimized");
        } else {
          btn.classList.remove("minimized");
        }
      } else {
        btn.classList.remove("active");
        btn.classList.remove("minimized");
      }
    });
  }

  function updateTaskbarBadge(appPath) {
    const btn = taskbarApps.querySelector(`[data-app-path="${appPath}"]`);
    if (!btn) return;
    let badge = btn.querySelector(".taskbar-badge");
    if (badge) badge.remove();
    const count = webOSState.openAppWindows[appPath]
      ? webOSState.openAppWindows[appPath].length
      : 0;
    if (count > 1) {
      badge = document.createElement("span");
      badge.className = "taskbar-badge";
      badge.textContent = count;
      btn.appendChild(badge);
    }
    btn.title = count > 1 ? `${count} windows open` : btn.title.split(" (")[0];
  }

  let contextMenu = null;
  function showTaskbarContextMenu(appPath, x, y) {
    hideTaskbarContextMenu();
    contextMenu = document.createElement("div");
    contextMenu.className = "taskbar-context-menu";
    contextMenu.style.position = "fixed";
    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.style.zIndex = 99999;
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="new">Open new window</div>
      <div class="context-menu-item" data-action="minimize">Minimize all</div>
      <div class="context-menu-item" data-action="close">Close all windows</div>
    `;
    document.body.appendChild(contextMenu);
    const menuRect = contextMenu.getBoundingClientRect();
    let newLeft = x,
      newTop = y;
    if (menuRect.right > window.innerWidth) {
      newLeft = Math.max(0, window.innerWidth - menuRect.width - 4);
      contextMenu.style.left = newLeft + "px";
    }
    if (menuRect.bottom > window.innerHeight) {
      newTop = Math.max(0, window.innerHeight - menuRect.height - 4);
      contextMenu.style.top = newTop + "px";
    }
    contextMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      const action = item.getAttribute("data-action");
      if (action === "close") {
        if (webOSState.openAppWindows[appPath]) {
          webOSState.openAppWindows[appPath].forEach((win) => win.remove());
          delete webOSState.openAppWindows[appPath];
          removeTaskbarIcon(appPath);
        }
      } else if (action === "minimize") {
        if (webOSState.openAppWindows[appPath]) {
          webOSState.openAppWindows[appPath].forEach(
            (win) => (win.style.display = "none")
          );
        }
      } else if (action === "new") {
        let btn = taskbarApps.querySelector(`[data-app-path="${appPath}"]`);
        let appName = btn ? btn.title : "App";
        let appIcon = btn ? btn.innerHTML : "";
        createAppWindow({ appName, appIcon, appPath });
      }
      hideTaskbarContextMenu();
    });
    setTimeout(() => {
      document.addEventListener("mousedown", hideTaskbarContextMenu, {
        once: true,
      });
    }, 0);
  }
  function hideTaskbarContextMenu() {
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
    }
  }

  // Taskbar preview functionality
  let taskbarPreview = null;
  let previewTimeout = null;
  let previewDisabledForApp = new Set(); // Track which apps have preview disabled
  let previewHiddenForApp = new Set(); // Track which apps have preview hidden after click

  function createTaskbarPreview() {
    if (taskbarPreview) return taskbarPreview;

    taskbarPreview = document.createElement("div");
    taskbarPreview.className = "taskbar-preview";
    taskbarPreview.innerHTML = `
      <div class="taskbar-preview-header">
        <div class="taskbar-preview-title">
          <span class="preview-app-icon"></span>
          <span class="preview-app-name"></span>
        </div>
        <button class="taskbar-preview-close">✖</button>
      </div>
      <div class="taskbar-preview-grid"></div>
    `;

    // Close preview on close button click
    taskbarPreview
      .querySelector(".taskbar-preview-close")
      .addEventListener("click", () => {
        console.log("Close button clicked - hiding preview");
        hideTaskbarPreview();
      });

    // Close preview on outside click
    document.addEventListener("mousedown", (e) => {
      if (
        !taskbarPreview.contains(e.target) &&
        !e.target.closest(".taskbar-app")
      ) {
        hideTaskbarPreview();
      }
    });

    // Keep preview open when hovering over it
    taskbarPreview.addEventListener("mouseenter", () => {
      console.log("Mouse enter on preview - keeping open");
    });

    taskbarPreview.addEventListener("mouseleave", () => {
      console.log("Mouse leave on preview - hiding");
      setTimeout(() => {
        if (!taskbarPreview.matches(":hover")) {
          hideTaskbarPreview();
        }
      }, 100);
    });

    document.body.appendChild(taskbarPreview);
    return taskbarPreview;
  }

  function showTaskbarPreview(appPath, btn) {
    if (
      !webOSState.openAppWindows[appPath] ||
      webOSState.openAppWindows[appPath].length === 0
    ) {
      return;
    }

    const preview = createTaskbarPreview();
    const windows = webOSState.openAppWindows[appPath];
    const btnRect = btn.getBoundingClientRect();

    // Calculate preview position
    const previewWidth = Math.min(400, windows.length * 128 + 32); // 128px per item + padding
    let left = btnRect.left + btnRect.width / 2 - previewWidth / 2;

    // Ensure preview doesn't go off screen
    if (left < 10) left = 10;
    if (left + previewWidth > window.innerWidth - 10) {
      left = window.innerWidth - previewWidth - 10;
    }

    // Position preview above taskbar button
    preview.style.left = `${left}px`;
    preview.style.bottom = `${window.innerHeight - btnRect.top + 10}px`;
    preview.style.width = `${previewWidth}px`;

    // Update preview content
    const appIcon = btn.innerHTML;
    const appName = btn.title;

    preview.querySelector(".preview-app-icon").innerHTML = appIcon;
    preview.querySelector(".preview-app-name").textContent = appName;

    const previewGrid = preview.querySelector(".taskbar-preview-grid");
    previewGrid.innerHTML = "";

    // Create preview items for each window
    windows.forEach((window, index) => {
      const previewItem = document.createElement("div");
      previewItem.className = "taskbar-preview-item";
      previewItem.dataset.windowIndex = index;

      // Add window number badge if multiple windows
      if (windows.length > 1) {
        const badge = document.createElement("div");
        badge.style.cssText = `
          position: absolute;
          top: 4px;
          right: 4px;
          background: #667eea;
          color: white;
          font-size: 10px;
          font-weight: bold;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        `;
        badge.textContent = index + 1;
        previewItem.appendChild(badge);
      }

      // Check if window is active/visible
      if (window.style.display !== "none") {
        const visibleWindows = windows.filter(
          (w) => w.style.display !== "none"
        );
        if (visibleWindows.length > 0) {
          const maxZIndex = Math.max(
            ...visibleWindows.map((w) => parseInt(w.style.zIndex) || 0)
          );
          if (window.style.zIndex == maxZIndex) {
            previewItem.classList.add("active");
          }
        }
      }

      // Add minimized indicator
      if (window.style.display === "none") {
        previewItem.style.opacity = "0.6";
        const minimizedBadge = document.createElement("div");
        minimizedBadge.style.cssText = `
          position: absolute;
          top: 4px;
          left: 4px;
          background: rgba(255, 255, 255, 0.8);
          color: #333;
          font-size: 8px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 3px;
          z-index: 2;
        `;
        minimizedBadge.textContent = "MIN";
        previewItem.appendChild(minimizedBadge);
      }

      // Create preview content
      const iframe = window.querySelector("iframe");
      if (iframe && iframe.contentDocument) {
        // Try to capture iframe content as preview
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 120;
          canvas.height = 80;

          // Create a simple preview based on app type
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, 120, 80);

          ctx.fillStyle = "#667eea";
          ctx.font = "12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(appName, 60, 40);

          const img = document.createElement("img");
          img.src = canvas.toDataURL();
          previewItem.appendChild(img);
        } catch (e) {
          // Fallback to placeholder
          const placeholder = document.createElement("div");
          placeholder.className = "preview-placeholder";
          placeholder.innerHTML = appIcon;
          previewItem.appendChild(placeholder);
        }
      } else {
        // Fallback to placeholder
        const placeholder = document.createElement("div");
        placeholder.className = "preview-placeholder";
        placeholder.innerHTML = appIcon;
        previewItem.appendChild(placeholder);
      }

      // Add window title
      const title = document.createElement("div");
      title.className = "preview-title";
      title.textContent = `${appName} ${
        windows.length > 1 ? `(${index + 1})` : ""
      }`;
      previewItem.appendChild(title);

      // Add click handler to focus window
      previewItem.addEventListener("click", () => {
        if (window.style.display === "none") {
          // Restore minimized window
          window.style.display = "flex";
          zIndexCounter++;
          window.style.zIndex = zIndexCounter;
        }
        focusWindow(window, appPath);
        hideTaskbarPreview();
      });

      previewGrid.appendChild(previewItem);
    });

    // Show preview with animation
    preview.classList.add("show");
  }

  function hideTaskbarPreview() {
    if (taskbarPreview) {
      taskbarPreview.classList.remove("show");
      // Clear any pending timeouts
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
      }
    }
  }

  function disablePreviewForApp(appPath) {
    console.log("Disabling preview for app:", appPath);
    previewDisabledForApp.add(appPath);
    console.log("Preview disabled apps:", Array.from(previewDisabledForApp));
    // Re-enable preview after mouse leaves the taskbar area
    setTimeout(() => {
      previewDisabledForApp.delete(appPath);
      console.log("Auto re-enabled preview for:", appPath);
    }, 1000); // 1 second delay
  }

  function focusWindow(window, appPath) {
    // Bring window to front
    window.style.display = "flex";
    window.style.zIndex = ++zIndexCounter;

    // Set active taskbar icon
    setActiveTaskbarIcon(appPath);

    // Focus iframe if possible
    const iframe = window.querySelector("iframe");
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus();
      } catch (e) {
        // Cross-origin restriction
      }
    }
  }

  function ensureTaskbarIcon({ appName, appIcon, appPath }) {
    console.log("Ensuring taskbar icon for:", appPath, appName);
    let btn = taskbarApps.querySelector(`[data-app-path="${appPath}"]`);
    if (!btn) {
      console.log("Creating new taskbar button for:", appPath);
      btn = document.createElement("button");
      btn.className = "taskbar-app";
      btn.dataset.appPath = appPath;
      btn.title = appName;
      btn.innerHTML = appIcon;

      // Click to focus/minimize windows
      btn.addEventListener("click", (e) => {
        // Hide preview immediately on click
        hideTaskbarPreview();

        if (webOSState.openAppWindows[appPath]) {
          if (webOSState.openAppWindows[appPath].length === 1) {
            // Alt+Click or Middle Click shows preview for single window
            if (e.altKey || e.button === 1) {
              showTaskbarPreview(appPath, btn);
              return;
            }
            // Single window - toggle minimize/restore
            const window = webOSState.openAppWindows[appPath][0];
            if (window.style.display === "none") {
              // Window is minimized - restore it
              focusWindow(window, appPath);
            } else {
              // Window is visible - minimize it
              window.style.display = "none";
              // Remove active state from taskbar
              btn.classList.remove("active");
            }
            // Hide preview for this app after click - don't show until mouse leaves and re-enters
            previewHiddenForApp.add(appPath);
          } else {
            // Multiple windows - show preview
            showTaskbarPreview(appPath, btn);
          }
        }
      });
      // Middle click also shows preview for single window
      btn.addEventListener("auxclick", (e) => {
        if (
          e.button === 1 &&
          webOSState.openAppWindows[appPath] &&
          webOSState.openAppWindows[appPath].length === 1
        ) {
          showTaskbarPreview(appPath, btn);
        }
      });

      // Hover to show preview (with delay)
      btn.addEventListener("mouseenter", (e) => {
        console.log("=== MOUSE ENTER EVENT ===");
        console.log("Mouse enter on taskbar app:", appPath);
        console.log("Event target:", e.target);
        console.log("Open windows:", webOSState.openAppWindows[appPath]);
        console.log("Preview disabled:", previewDisabledForApp.has(appPath));
        console.log("Preview hidden:", previewHiddenForApp.has(appPath));
        console.log("Button element:", btn);
        console.log("Button dataset:", btn.dataset);

        // Don't show preview if it's hidden for this app
        if (previewHiddenForApp.has(appPath)) {
          console.log("Preview hidden for app:", appPath);
          return;
        }

        if (
          webOSState.openAppWindows[appPath] &&
          webOSState.openAppWindows[appPath].length > 0
        ) {
          console.log("Setting preview timeout for:", appPath);
          previewTimeout = setTimeout(() => {
            console.log("Showing preview for:", appPath);
            showTaskbarPreview(appPath, btn);
          }, 300); // 300ms delay
        } else {
          console.log("Preview not shown because:", {
            hasWindows: !!webOSState.openAppWindows[appPath],
            windowCount: webOSState.openAppWindows[appPath]?.length || 0,
            isDisabled: previewDisabledForApp.has(appPath),
            isHidden: previewHiddenForApp.has(appPath),
          });
        }
      });

            btn.addEventListener("mouseleave", () => {
        console.log("Mouse leave on taskbar app:", appPath);
        if (previewTimeout) {
          console.log("Clearing preview timeout for:", appPath);
          clearTimeout(previewTimeout);
          previewTimeout = null;
        }
        
        // Hide preview after a short delay (unless user is hovering over preview)
        setTimeout(() => {
          const isHoveringPreview =
            taskbarPreview &&
            (taskbarPreview.matches(":hover") ||
              taskbarPreview.contains(document.activeElement));
          const isHoveringButton = btn.matches(":hover");
          
          if (!isHoveringPreview && !isHoveringButton) {
            console.log("Hiding preview after mouse leave");
            hideTaskbarPreview();
          }
        }, 200); // 200ms delay to allow moving to preview
        
        // Re-enable preview for this app after mouse leaves (if it was hidden)
        if (previewHiddenForApp.has(appPath)) {
          console.log("Re-enabling preview for app after mouse leave:", appPath);
          setTimeout(() => {
            previewHiddenForApp.delete(appPath);
            console.log("Preview re-enabled for:", appPath);
          }, 100); // 100ms delay after mouse leaves
        }
        
        // But if this is a single window app and preview was disabled, re-enable it after mouse leaves
        if (
          webOSState.openAppWindows[appPath] &&
          webOSState.openAppWindows[appPath].length === 1
        ) {
          console.log("Re-enabling preview for single window app:", appPath);
          setTimeout(() => {
            previewDisabledForApp.delete(appPath);
            console.log("Preview re-enabled for:", appPath);
          }, 500); // 500ms delay after mouse leaves
        }
      });

      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showTaskbarContextMenu(appPath, e.clientX, e.clientY);
      });

      taskbarApps.appendChild(btn);

      // Test: Add immediate event listener after appending
      console.log("Adding test event listener to button:", btn);
      btn.addEventListener("mouseenter", () => {
        console.log("TEST: Mouse enter detected on button for:", appPath);
      });
    }
    updateTaskbarBadge(appPath);
    return btn;
  }

  function removeTaskbarIcon(appPath) {
    let btn = taskbarApps.querySelector(`[data-app-path="${appPath}"]`);
    if (btn) btn.remove();
  }

  function createAppWindow({ appName, appIcon, appPath }) {
    const win = document.createElement("div");
    win.className = "app-window";
    // --- Restore last position/size if available ---
    let savedState = null;
    try {
      savedState = JSON.parse(localStorage.getItem("webos-window-" + appPath));
    } catch {}
    if (savedState && typeof savedState === "object") {
      // Parse values
      let left = parseInt(savedState.left);
      let top = parseInt(savedState.top);
      let width = parseInt(savedState.width);
      let height = parseInt(savedState.height);
      // Agar value valid nahi hai toh default lagao
      if (
        isNaN(left) ||
        isNaN(top) ||
        isNaN(width) ||
        isNaN(height) ||
        left < 0 ||
        top < 0 ||
        width < 100 ||
        height < 100 ||
        left > window.innerWidth - 50 ||
        top > window.innerHeight - 50
      ) {
        win.style.left = `${60 + Math.random() * 100}px`;
        win.style.top = `${80 + Math.random() * 80}px`;
        win.style.width = "500px";
        win.style.height = "400px";
      } else {
        win.style.left = left + "px";
        win.style.top = top + "px";
        win.style.width = width + "px";
        win.style.height = height + "px";
      }
    } else {
      win.style.left = `${60 + Math.random() * 100}px`;
      win.style.top = `${80 + Math.random() * 80}px`;
      win.style.width = "500px";
      win.style.height = "400px";
    }
    win.style.zIndex = ++zIndexCounter;
    win.style.display = "flex";
    win.style.flexDirection = "column";
    win.style.position = "fixed";
    win.style.animation = "fadeIn 0.2s";

    // --- Add 8 resize handles ---
    const directions = [
      "top",
      "right",
      "bottom",
      "left",
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ];
    directions.forEach((dir) => {
      const handle = document.createElement("div");
      handle.className = "resize-handle";
      handle.setAttribute("data-direction", dir);
      win.appendChild(handle);
    });

    // --- Resize logic (mouse + touch) ---
    const minWidth = 300,
      minHeight = 200,
      snapDist = 20;
    let resizing = false,
      resizeDir = null,
      startX = 0,
      startY = 0,
      startW = 0,
      startH = 0,
      startL = 0,
      startT = 0;
    // Yeh functions closure me hi rakho
    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }
    function snap(val, edge) {
      return Math.abs(val - edge) < snapDist ? edge : val;
    }
    function saveWindowState() {
      localStorage.setItem(
        "webos-window-" + appPath,
        JSON.stringify({
          left: win.style.left,
          top: win.style.top,
          width: win.style.width,
          height: win.style.height,
        })
      );
    }
    // Pakka fix: listeners ka reference
    function mouseMoveResizeHandler(e) {
      if (!resizing) return;
      onResizeMove(e);
    }
    function mouseUpResizeHandler(e) {
      if (!resizing) return;
      resizing = false;
      document.removeEventListener("mousemove", mouseMoveResizeHandler);
      document.removeEventListener("mouseup", mouseUpResizeHandler);
      document.body.style.userSelect = "";
      saveWindowState();
    }
    // Touch resize ke liye bhi reference handlers
    function touchMoveResizeHandler(e) {
      if (!resizing) return;
      onResizeMove(e);
    }
    function touchEndResizeHandler(e) {
      if (!resizing) return;
      resizing = false;
      document.removeEventListener("touchmove", touchMoveResizeHandler, {
        passive: false,
      });
      document.removeEventListener("touchend", touchEndResizeHandler);
      document.body.style.userSelect = "";
      saveWindowState();
    }
    function onResizeMove(e) {
      if (!resizing || win.classList.contains("fullscreen")) return;
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      let dx = clientX - startX;
      let dy = clientY - startY;
      let newW = startW,
        newH = startH,
        newL = startL,
        newT = startT;
      if (resizeDir.includes("right"))
        newW = clamp(startW + dx, minWidth, window.innerWidth - startL);
      if (resizeDir.includes("left")) {
        newW = clamp(startW - dx, minWidth, startL + startW);
        newL = clamp(startL + dx, 0, startL + startW - minWidth);
      }
      if (resizeDir.includes("bottom"))
        newH = clamp(startH + dy, minHeight, window.innerHeight - startT);
      if (resizeDir.includes("top")) {
        newH = clamp(startH - dy, minHeight, startT + startH);
        newT = clamp(startT + dy, 0, startT + startH - minHeight);
      }
      // Snap to edges
      if (resizeDir.includes("left")) newL = snap(newL, 0);
      if (resizeDir.includes("top")) newT = snap(newT, 0);
      if (resizeDir.includes("right"))
        newW = snap(newL + newW, window.innerWidth) - newL;
      if (resizeDir.includes("bottom"))
        newH = snap(newT + newH, window.innerHeight) - newT;
      // Prevent overflow
      newW = Math.min(newW, window.innerWidth - newL);
      newH = Math.min(newH, window.innerHeight - newT);
      win.style.width = newW + "px";
      win.style.height = newH + "px";
      win.style.left = newL + "px";
      win.style.top = newT + "px";
      e.preventDefault && e.preventDefault();
    }
    win.querySelectorAll(".resize-handle").forEach((handle) => {
      handle.addEventListener("mousedown", function (e) {
        if (win.classList.contains("fullscreen")) return;
        resizing = true;
        resizeDir = handle.getAttribute("data-direction");
        startX = e.clientX;
        startY = e.clientY;
        startW = win.offsetWidth;
        startH = win.offsetHeight;
        startL = win.offsetLeft;
        startT = win.offsetTop;
        document.body.style.userSelect = "none";
        // Pakka: pehle remove karo, fir add karo (memory leak na ho)
        document.removeEventListener("mousemove", mouseMoveResizeHandler);
        document.removeEventListener("mouseup", mouseUpResizeHandler);
        document.addEventListener("mousemove", mouseMoveResizeHandler);
        document.addEventListener("mouseup", mouseUpResizeHandler);
        e.preventDefault();
        e.stopPropagation();
      });
      handle.addEventListener(
        "touchstart",
        function (e) {
          if (win.classList.contains("fullscreen")) return;
          resizing = true;
          resizeDir = handle.getAttribute("data-direction");
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          startW = win.offsetWidth;
          startH = win.offsetHeight;
          startL = win.offsetLeft;
          startT = win.offsetTop;
          document.body.style.userSelect = "none";
          // Pehle remove karo, fir add karo
          document.removeEventListener("touchmove", touchMoveResizeHandler, {
            passive: false,
          });
          document.removeEventListener("touchend", touchEndResizeHandler);
          document.addEventListener("touchmove", touchMoveResizeHandler, {
            passive: false,
          });
          document.addEventListener("touchend", touchEndResizeHandler);
          e.preventDefault();
          e.stopPropagation();
        },
        { passive: false }
      );
    });

    // --- Pinch-to-resize (mobile/tablet) ---
    let pinchResizing = false,
      pinchStartDist = 0,
      pinchStartW = 0,
      pinchStartH = 0;
    win.addEventListener("touchstart", function (e) {
      if (win.classList.contains("fullscreen")) return;
      if (e.touches.length === 2) {
        pinchResizing = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.sqrt(dx * dx + dy * dy);
        pinchStartW = win.offsetWidth;
        pinchStartH = win.offsetHeight;
      }
    });
    win.addEventListener(
      "touchmove",
      function (e) {
        if (!pinchResizing || win.classList.contains("fullscreen")) return;
        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = dist / pinchStartDist;
          let newW = clamp(
            Math.round(pinchStartW * scale),
            minWidth,
            window.innerWidth - win.offsetLeft
          );
          let newH = clamp(
            Math.round(pinchStartH * scale),
            minHeight,
            window.innerHeight - win.offsetTop
          );
          // Snap
          if (Math.abs(win.offsetLeft + newW - window.innerWidth) < snapDist)
            newW = window.innerWidth - win.offsetLeft;
          if (Math.abs(win.offsetTop + newH - window.innerHeight) < snapDist)
            newH = window.innerHeight - win.offsetTop;
          win.style.width = newW + "px";
          win.style.height = newH + "px";
          e.preventDefault();
        }
      },
      { passive: false }
    );
    win.addEventListener("touchend", function (e) {
      if (e.touches.length < 2) {
        pinchResizing = false;
        saveWindowState();
      }
    });

    const header = document.createElement("div");
    header.className = "app-window-header";
    header.style.cursor = "move";
    const titleSpan = document.createElement("span");
    titleSpan.innerHTML = `${appIcon} ${appName}`;
    titleSpan.style.flex = "1";
    titleSpan.style.textAlign = "left";
    titleSpan.style.fontSize = "15px";
    titleSpan.style.paddingRight = "8px";
    titleSpan.style.userSelect = "none";
    const controls = document.createElement("div");
    controls.className = "app-window-controls";
    const minBtn = document.createElement("button");
    minBtn.className = "window-btn";
    minBtn.title = "Minimize";
    minBtn.textContent = "_";
    const maxBtn = document.createElement("button");
    maxBtn.className = "window-btn";
    maxBtn.title = "Maximize";
    maxBtn.textContent = "□";
    const closeBtn = document.createElement("button");
    closeBtn.className = "window-btn";
    closeBtn.title = "Close";
    closeBtn.textContent = "✖️";
    controls.append(minBtn, maxBtn, closeBtn);
    header.append(titleSpan, controls);
    win.appendChild(header);
    const iframe = document.createElement("iframe");
    iframe.src = appPath;
    iframe.style.width = "100%";
    iframe.style.flex = "1";
    iframe.style.border = "none";
    iframe.style.background = "transparent";
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-forms allow-same-origin"
    );
    win.appendChild(iframe);
    document.body.appendChild(win);
    if (!webOSState.openAppWindows[appPath])
      webOSState.openAppWindows[appPath] = [];
    webOSState.openAppWindows[appPath].push(win);
    ensureTaskbarIcon({ appName, appIcon, appPath });
    setActiveTaskbarIcon(appPath);
    updateTaskbarBadge(appPath);

    win.addEventListener("mousedown", () => {
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
      setActiveTaskbarIcon(appPath);
    });

    let isDragging = false,
      offsetX = 0,
      offsetY = 0,
      isMaximized = false,
      prevSize = {};
    header.addEventListener("mousedown", function (e) {
      if (e.target.closest(".app-window-controls")) return;
      isDragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      document.body.style.userSelect = "none";
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
    });
    document.addEventListener("mousemove", function (e) {
      if (isDragging && !isMaximized) {
        let newL = clamp(
          e.clientX - offsetX,
          0,
          window.innerWidth - win.offsetWidth
        );
        let newT = clamp(
          e.clientY - offsetY,
          0,
          window.innerHeight - win.offsetHeight
        );
        // Snap
        newL = snap(newL, 0);
        newT = snap(newT, 0);
        newL =
          snap(newL + win.offsetWidth, window.innerWidth) - win.offsetWidth;
        newT =
          snap(newT + win.offsetHeight, window.innerHeight) - win.offsetHeight;
        win.style.left = newL + "px";
        win.style.top = newT + "px";
      }
    });
    document.addEventListener("mouseup", function () {
      if (isDragging) saveWindowState();
      isDragging = false;
      document.body.style.userSelect = "";
    });

    // --- Touch drag for app window header (mobile/tablet) ---
    header.addEventListener("touchstart", function (e) {
      if (e.target.closest(".app-window-controls")) return;
      if (win.classList.contains("fullscreen")) return;
      isDragging = true;
      offsetX = e.touches[0].clientX - win.offsetLeft;
      offsetY = e.touches[0].clientY - win.offsetTop;
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
    });
    document.addEventListener(
      "touchmove",
      function (e) {
        if (isDragging && !isMaximized && e.touches && e.touches[0]) {
          let newL = clamp(
            e.touches[0].clientX - offsetX,
            0,
            window.innerWidth - win.offsetWidth
          );
          let newT = clamp(
            e.touches[0].clientY - offsetY,
            0,
            window.innerHeight - win.offsetHeight
          );
          // Snap
          newL = snap(newL, 0);
          newT = snap(newT, 0);
          newL =
            snap(newL + win.offsetWidth, window.innerWidth) - win.offsetWidth;
          newT =
            snap(newT + win.offsetHeight, window.innerHeight) -
            win.offsetHeight;
          win.style.left = newL + "px";
          win.style.top = newT + "px";
        }
      },
      { passive: false }
    );
    document.addEventListener("touchend", function () {
      if (isDragging) saveWindowState();
      isDragging = false;
    });

    // --- Double-click/double-tap to maximize/restore ---
    let lastTap = 0;
    function maximizeWindow() {
      if (!isMaximized) {
        prevSize = {
          left: win.style.left,
          top: win.style.top,
          width: win.style.width,
          height: win.style.height,
        };
        win.style.left = "0";
        win.style.top = "0";
        win.style.width = "100vw";
        win.style.height = "100vh";
        isMaximized = true;
        maxBtn.textContent = "❐";
      } else {
        win.style.left = prevSize.left || "calc(50% - 250px)";
        win.style.top = prevSize.top || "100px";
        win.style.width = prevSize.width || "500px";
        win.style.height = prevSize.height || "400px";
        isMaximized = false;
        maxBtn.textContent = "□";
      }
      saveWindowState();
    }
    header.addEventListener("dblclick", maximizeWindow);
    header.addEventListener("touchend", function (e) {
      const now = Date.now();
      if (now - lastTap < 350) {
        maximizeWindow();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    });
    maxBtn.addEventListener("click", maximizeWindow);

    closeBtn.addEventListener("click", () => {
      win.remove();
      if (webOSState.openAppWindows[appPath]) {
        webOSState.openAppWindows[appPath] = webOSState.openAppWindows[
          appPath
        ].filter((w) => w !== win);
        if (webOSState.openAppWindows[appPath].length === 0) {
          delete webOSState.openAppWindows[appPath];
          removeTaskbarIcon(appPath);
        } else {
          updateTaskbarBadge(appPath);
          // Update taskbar state after window close
          setActiveTaskbarIcon(appPath);
        }
      }
      // Remove window state from storage
      localStorage.removeItem("webos-window-" + appPath);
    });
    minBtn.addEventListener("click", () => {
      win.style.display = "none";
      // Update taskbar state after minimize
      setActiveTaskbarIcon(appPath);
    });
    win.addEventListener("dblclick", () => {
      win.style.display = "flex";
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
      // Update taskbar state after restore
      setActiveTaskbarIcon(appPath);
    });

    iframe.addEventListener("load", () => {
      iframe.contentWindow.postMessage(
        { type: "webos-handshake", appName },
        "*"
      );
    });
    return win;
  }

  window.addEventListener("message", (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== "object" || !msg.type) return;
    if (msg.type === "webos-handshake-app") {
      event.source.postMessage(
        {
          type: "webos-api",
          api: {
            notify: true,
          },
        },
        event.origin || "*"
      );
    }
    if (msg.type === "webos-notify") {
      alert(`App Notification: ${msg.text}`);
    }
  });

  // --- Desktop Context Menu ---
  let desktopContextMenu = null;
  function showDesktopContextMenu(x, y, apps) {
    hideDesktopContextMenu();
    desktopContextMenu = document.createElement("div");
    desktopContextMenu.className = "desktop-context-menu";

    // Check if there are hidden apps
    const hasHiddenApps = hiddenApps.size > 0;

    desktopContextMenu.innerHTML = `
      <div class="context-menu-item" data-action="create-file">Create File</div>
      <div class="context-menu-item" data-action="create-folder">Create Folder</div>
      <hr class="context-menu-separator" />
      <div class="context-menu-item" data-action="change-wallpaper">Change Wallpaper</div>
      <div class="context-menu-item" data-action="view-settings">View Settings</div>
      ${
        hasHiddenApps
          ? '<div class="context-menu-item" data-action="show-hidden-apps">Show Hidden Apps</div>'
          : ""
      }
      <hr class="context-menu-separator" />
      <div class="context-menu-item" data-action="refresh">Refresh</div>
    `;
    document.body.appendChild(desktopContextMenu);
    // Positioning
    desktopContextMenu.style.position = "fixed";
    desktopContextMenu.style.left = x + "px";
    desktopContextMenu.style.top = y + "px";
    desktopContextMenu.style.bottom = "";
    // Prevent menu from closing on its own click
    desktopContextMenu.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    // Action handling
    desktopContextMenu.addEventListener("click", function (e) {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      const action = item.getAttribute("data-action");
      if (action === "create-file") {
        const id = "file-" + Date.now() + Math.floor(Math.random() * 1000);
        let name = "New File";
        let pos = { left: x, top: y };
        desktopItems.push({ id, type: "file", name, pos });
        saveDesktopItems();
        renderDesktopIcons(apps);
      } else if (action === "create-folder") {
        const id = "folder-" + Date.now() + Math.floor(Math.random() * 1000);
        let name = "New Folder";
        let pos = { left: x, top: y };
        desktopItems.push({ id, type: "folder", name, pos });
        saveDesktopItems();
        renderDesktopIcons(apps);
      } else if (action === "change-wallpaper") {
        const wallpaperApp = Array.from(
          document.querySelectorAll(".desktop-icon")
        ).find(
          (icon) =>
            icon.dataset.appPath &&
            icon.dataset.appPath.includes("wallpaper-changer")
        );
        if (wallpaperApp) {
          wallpaperApp.dispatchEvent(new MouseEvent("dblclick"));
        } else {
          alert("Wallpaper changer app not found!");
        }
      } else if (action === "view-settings") {
        alert("(Demo) Settings panel coming soon!");
      } else if (action === "show-hidden-apps") {
        showHiddenAppsDialog();
      } else if (action === "refresh") {
        window.location.reload();
      }
      hideDesktopContextMenu();
    });
    setTimeout(() => {
      document.addEventListener("mousedown", hideDesktopContextMenu, {
        once: true,
      });
    }, 100);
  }
  function hideDesktopContextMenu() {
    if (desktopContextMenu) {
      desktopContextMenu.remove();
      desktopContextMenu = null;
    }
  }

  function showHiddenAppsDialog() {
    if (hiddenApps.size === 0) return;

    const dialog = document.createElement("div");
    dialog.className = "modal";
    dialog.style.display = "flex";
    dialog.style.position = "fixed";
    dialog.style.top = "0";
    dialog.style.left = "0";
    dialog.style.width = "100%";
    dialog.style.height = "100%";
    dialog.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    dialog.style.zIndex = "99999";
    dialog.style.alignItems = "center";
    dialog.style.justifyContent = "center";

    const content = document.createElement("div");
    content.style.background = "rgba(32, 32, 32, 0.95)";
    content.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    content.style.borderRadius = "12px";
    content.style.padding = "24px";
    content.style.maxWidth = "400px";
    content.style.width = "90%";
    content.style.color = "white";
    content.style.backdropFilter = "blur(40px)";

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px;">Hidden Apps</h3>
      <div style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">
        Select apps to show on desktop:
      </div>
      <div id="hiddenAppsList" style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancelHiddenBtn" style="padding: 8px 16px; border: none; border-radius: 6px; background: rgba(255, 255, 255, 0.1); color: white; cursor: pointer;">Cancel</button>
        <button id="restoreHiddenBtn" style="padding: 8px 16px; border: none; border-radius: 6px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; cursor: pointer;">Restore Selected</button>
      </div>
    `;

    dialog.appendChild(content);
    document.body.appendChild(dialog);

    // Populate hidden apps list
    const hiddenAppsList = dialog.querySelector("#hiddenAppsList");
    const selectedApps = new Set();

    Array.from(hiddenApps).forEach((appPath) => {
      const app = loadedApps.find((a) => a.appPath === appPath);
      if (app) {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "12px";
        item.style.padding = "8px";
        item.style.borderRadius = "6px";
        item.style.cursor = "pointer";
        item.style.marginBottom = "4px";
        item.style.transition = "background 0.2s";

        item.innerHTML = `
          <input type="checkbox" style="margin: 0;" data-app-path="${appPath}">
          <span style="font-size: 16px;">${app.icon || "📦"}</span>
          <span style="flex: 1;">${app.name}</span>
        `;

        const checkbox = item.querySelector("input");
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            selectedApps.add(appPath);
          } else {
            selectedApps.delete(appPath);
          }
        });

        item.addEventListener("click", () => {
          checkbox.checked = !checkbox.checked;
          if (checkbox.checked) {
            selectedApps.add(appPath);
          } else {
            selectedApps.delete(appPath);
          }
        });

        hiddenAppsList.appendChild(item);
      }
    });

    // Event listeners
    dialog.querySelector("#cancelHiddenBtn").addEventListener("click", () => {
      document.body.removeChild(dialog);
    });

    dialog.querySelector("#restoreHiddenBtn").addEventListener("click", () => {
      selectedApps.forEach((appPath) => {
        hiddenApps.delete(appPath);
      });
      saveDesktopItems();
      renderDesktopIcons(loadedApps);
      document.body.removeChild(dialog);
    });

    // Close on outside click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }
  // Attach to desktop area
  const desktop = document.getElementById("desktop");
  let loadedApps = [];
  // Load state
  loadDesktopIconPositions();
  loadDesktopItems();
  const apps = await loadAppManifests();
  loadedApps = apps;
  let renderDesktopIconsPatched = false;
  let origRenderDesktopIcons = null;
  function patchRenderDesktopIcons() {
    if (renderDesktopIconsPatched) return;
    origRenderDesktopIcons = renderDesktopIcons;
    renderDesktopIcons = function (apps) {
      origRenderDesktopIcons(apps);
      document.querySelectorAll(".desktop-icon").forEach((icon) => {
        icon.addEventListener("click", function (e) {
          if (e.ctrlKey || e.metaKey) {
            toggleIconSelection(icon);
          } else if (e.shiftKey) {
            selectIcon(icon, true);
          } else {
            selectIcon(icon, false);
          }
          e.stopPropagation();
        });
        icon.addEventListener("mousedown", (e) => e.stopPropagation());
        icon.addEventListener("contextmenu", function (e) {
          e.preventDefault();
          if (!icon.classList.contains("selected")) selectIcon(icon, false);
          showIconContextMenu(e.clientX, e.clientY, icon);
        });
        icon.addEventListener("touchstart", function (e) {
          touchMoved = false;
          touchStartTime = Date.now();
          longPressTimeout = setTimeout(() => {
            if (!touchMoved) {
              if (!icon.classList.contains("selected")) selectIcon(icon, false);
              showIconContextMenu(
                e.touches[0].clientX,
                e.touches[0].clientY,
                icon
              );
            }
          }, 500); // 500ms for long-press
          // Save initial offset for drag
          icon._dragOffsetX = e.touches[0].clientX - icon.offsetLeft;
          icon._dragOffsetY = e.touches[0].clientY - icon.offsetTop;
        });
        icon.addEventListener("touchmove", function (e) {
          touchMoved = true;
          clearTimeout(longPressTimeout);
          if (e.touches.length === 1) {
            e.preventDefault();
            let x = e.touches[0].clientX - (icon._dragOffsetX || 36);
            let y = e.touches[0].clientY - (icon._dragOffsetY || 40);
            icon.style.left = x + "px";
            icon.style.top = y + "px";
          }
        });
      });
    };
    renderDesktopIconsPatched = true;
  }
  patchRenderDesktopIcons();
  renderDesktopIcons(loadedApps);

  // --- Touch drag for app windows on mobile/tablet ---
  document.body.addEventListener("touchstart", function (e) {
    const header = e.target.closest(".app-window-header");
    if (!header) return;
    const win = header.parentElement;
    if (
      !win.classList.contains("app-window") ||
      win.classList.contains("fullscreen")
    )
      return;
    let startX = e.touches[0].clientX;
    let startY = e.touches[0].clientY;
    let origLeft = parseInt(win.style.left) || win.offsetLeft;
    let origTop = parseInt(win.style.top) || win.offsetTop;
    let dragging = true;
    function onMove(ev) {
      if (!dragging) return;
      ev.preventDefault();
      let dx = ev.touches[0].clientX - startX;
      let dy = ev.touches[0].clientY - startY;
      win.style.left = origLeft + dx + "px";
      win.style.top = origTop + dy + "px";
    }
    function onEnd() {
      dragging = false;
      document.removeEventListener("touchmove", onMove, { passive: false });
      document.removeEventListener("touchend", onEnd);
    }
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  });

  // App grid click (start menu)
  appGrid.addEventListener("click", function (e) {
    let appItem = e.target.closest(".app-item");
    if (appItem) {
      const appName = appItem.getAttribute("data-app-name") || "App";
      const appIcon = appItem.getAttribute("data-app-icon") || "";
      const appPath = appItem.getAttribute("data-app-path");
      if (appPath) {
        createAppWindow({ appName, appIcon, appPath });
        if (window.closeStartMenu) window.closeStartMenu();
        if (window.closeNotificationPanel) window.closeNotificationPanel();
      }
    }
  });

  // Desktop context menu
  desktop.addEventListener("contextmenu", function (e) {
    if (
      e.target.classList.contains("desktop-icon") ||
      e.target.closest(".app-window")
    ) {
      return;
    }
    e.preventDefault();
    showDesktopContextMenu(e.pageX, e.pageY, loadedApps);
  });

  let selectedIcons = new Set();
  function clearSelection() {
    document
      .querySelectorAll(".desktop-icon.selected")
      .forEach((icon) => icon.classList.remove("selected"));
    selectedIcons.clear();
  }
  function selectIcon(icon, multi = false) {
    if (!multi) clearSelection();
    icon.classList.add("selected");
    selectedIcons.add(icon.dataset.appPath || icon.dataset.itemId);
  }
  function toggleIconSelection(icon) {
    const key = icon.dataset.appPath || icon.dataset.itemId;
    if (icon.classList.contains("selected")) {
      icon.classList.remove("selected");
      selectedIcons.delete(key);
    } else {
      icon.classList.add("selected");
      selectedIcons.add(key);
    }
  }
  // Deselect on desktop click
  desktop.addEventListener("mousedown", function (e) {
    if (e.target === desktop || e.target === desktopIconsContainer) {
      clearSelection();
    }
  });
  // Icon context menu
  let iconContextMenu = null;
  function showIconContextMenu(x, y, icon) {
    hideIconContextMenu();
    iconContextMenu = document.createElement("div");
    iconContextMenu.className = "desktop-context-menu";
    const selected = Array.from(
      document.querySelectorAll(".desktop-icon.selected")
    );
    let menu = "";

    // Check if selected items are system apps or user files
    const isSystemApp = selected.length === 1 && selected[0].dataset.appPath;

    if (selected.length === 1) {
      if (isSystemApp) {
        menu +=
          '<div class="context-menu-item" data-action="hide">Hide from Desktop</div>';
      } else {
        menu +=
          '<div class="context-menu-item" data-action="rename">Rename</div>';
      }
    }

    if (isSystemApp) {
      menu +=
        '<div class="context-menu-item" data-action="delete">Remove from Desktop</div>';
    } else {
      menu +=
        '<div class="context-menu-item" data-action="delete">Delete</div>';
    }

    if (!isSystemApp) {
      menu +=
        '<div class="context-menu-item" data-action="duplicate">Duplicate</div>';
    }

    iconContextMenu.innerHTML = menu;
    document.body.appendChild(iconContextMenu);
    // Positioning
    iconContextMenu.style.position = "fixed";
    iconContextMenu.style.left = x + "px";
    iconContextMenu.style.top = y + "px";
    iconContextMenu.style.bottom = "";
    iconContextMenu.addEventListener("mousedown", (e) => e.stopPropagation());
    iconContextMenu.addEventListener("click", function (e) {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      const action = item.getAttribute("data-action");
      const selected = Array.from(
        document.querySelectorAll(".desktop-icon.selected")
      );
      if (action === "rename" && selected.length === 1) {
        const icon = selected[0];
        const label = icon.querySelector(".icon-label");
        const oldName = label.textContent;
        const input = document.createElement("input");
        input.type = "text";
        input.value = oldName;
        input.className = "rename-input";
        label.style.display = "none";
        icon.appendChild(input);
        input.focus();
        input.select();
        function finishRename(save) {
          if (save) {
            const newName = input.value.trim() || oldName;
            label.textContent = newName;
            // Update in desktopItems
            let id = icon.dataset.itemId;
            if (id) {
              let item = desktopItems.find((i) => i.id === id);
              if (item) item.name = newName;
              saveDesktopItems();
            }
          }
          input.remove();
          label.style.display = "";
        }
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") finishRename(true);
          if (e.key === "Escape") finishRename(false);
        });
        input.addEventListener("blur", function () {
          finishRename(true);
        });
      } else if (action === "hide") {
        // Hide system app from desktop
        const appPath = selected[0].dataset.appPath;
        if (appPath) {
          hiddenApps.add(appPath);
          saveDesktopItems();
          renderDesktopIcons(loadedApps);
          clearSelection();
        }
      } else if (action === "delete") {
        const isSystemApp =
          selected.length === 1 && selected[0].dataset.appPath;

        if (isSystemApp) {
          // Remove system app from desktop
          if (!confirm("Remove this app from desktop?")) return;
          const appPath = selected[0].dataset.appPath;
          if (appPath) {
            hiddenApps.add(appPath);
            saveDesktopItems();
            renderDesktopIcons(loadedApps);
            clearSelection();
          }
        } else {
          // Delete user files/folders
          if (!confirm("Delete selected item(s)?")) return;
          let ids = selected.map((icon) => icon.dataset.itemId).filter(Boolean);
          desktopItems = desktopItems.filter((item) => !ids.includes(item.id));
          saveDesktopItems();
          renderDesktopIcons(loadedApps);
          clearSelection();
        }
      } else if (action === "duplicate") {
        // Duplicate selected items
        let ids = selected.map((icon) => icon.dataset.itemId).filter(Boolean);
        ids.forEach((id) => {
          let orig = desktopItems.find((item) => item.id === id);
          if (orig) {
            let copyName = orig.name + " (copy)";
            let pos = {
              left: (orig.pos.left || 40) + 40,
              top: (orig.pos.top || 40) + 40,
            };
            let newId =
              orig.type + "-" + Date.now() + Math.floor(Math.random() * 1000);
            desktopItems.push({
              id: newId,
              type: orig.type,
              name: copyName,
              pos,
            });
          }
        });
        saveDesktopItems();
        renderDesktopIcons(loadedApps);
        clearSelection();
      }
      hideIconContextMenu();
    });
    setTimeout(() => {
      document.addEventListener("mousedown", hideIconContextMenu, {
        once: true,
      });
    }, 100);
  }
  function hideIconContextMenu() {
    if (iconContextMenu) {
      iconContextMenu.remove();
      iconContextMenu = null;
    }
  }

  // --- Desktop long-press for context menu ---
  let desktopLongPressTimeout = null;
  desktop.addEventListener("touchstart", function (e) {
    if (
      e.target.classList.contains("desktop-icon") ||
      e.target.closest(".app-window")
    )
      return;
    desktopLongPressTimeout = setTimeout(() => {
      showDesktopContextMenu(
        e.touches[0].clientX,
        e.touches[0].clientY,
        loadedApps
      );
    }, 500);
  });
  desktop.addEventListener("touchmove", function () {
    clearTimeout(desktopLongPressTimeout);
  });
  desktop.addEventListener("touchend", function () {
    clearTimeout(desktopLongPressTimeout);
  });
});

async function getAppFolders() {
  try {
    const res = await fetch("apps/");
    if (res.ok) {
      const text = await res.text();
      const matches = [...text.matchAll(/href="([a-zA-Z0-9-_]+)\/?"/g)];
      const folders = matches
        .map((m) => m[1])
        .filter((name) => name && !name.includes("."));
      return [...new Set(folders)];
    }
  } catch (e) {
    return ["calculator", "text-editor", "wallpaper-changer"];
  }
  return ["calculator", "text-editor", "wallpaper-changer"];
}

async function loadAppManifests() {
  const appFolders = await getAppFolders();
  const manifests = [];
  for (const app of appFolders) {
    try {
      const res = await fetch(`apps/${app}/manifest.json`);
      if (res.ok) {
        const manifest = await res.json();
        manifests.push({
          ...manifest,
          appPath: `apps/${app}/${manifest.entry}`,
          appIcon: `apps/${app}/${manifest.icon}`,
        });
      }
    } catch (e) {
      console.warn(`Failed to load manifest for ${app}:`, e);
    }
  }
  return manifests;
}

function loadSettings() {
  try {
    const saved = localStorage.getItem("webos-settings");
    if (saved) {
      webOSState.settings = JSON.parse(saved);
    }
  } catch {}
}
function saveSettings() {
  try {
    localStorage.setItem("webos-settings", JSON.stringify(webOSState.settings));
  } catch {}
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  webOSState.settings.theme = theme;
  saveSettings();
}

function setUserProfile({ name, avatar }) {
  webOSState.settings.user = { name, avatar };
  saveSettings();
}

function setWallpaper(url) {
  const desktop = document.querySelector(".desktop");
  if (desktop) {
    if (url) {
      // Set custom wallpaper
      desktop.style.backgroundImage = `url('${url}')`;
      webOSState.settings.wallpaper = url;
    } else {
      // Reset to default wallpaper
      desktop.style.backgroundImage = "url('../assets/wallpapers/bg.jpg')";
      webOSState.settings.wallpaper = null;
    }
    desktop.style.backgroundSize = "cover";
    desktop.style.backgroundPosition = "center";
    desktop.style.backgroundRepeat = "no-repeat";
    saveSettings();
  }
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object" || !msg.type) return;
  if (msg.type === "webos-set-wallpaper") {
    setWallpaper(msg.url);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  if (webOSState.settings.theme) {
    applyTheme(webOSState.settings.theme);
  }
  if (webOSState.settings.wallpaper) {
    setWallpaper(webOSState.settings.wallpaper);
  } else {
    // Set default wallpaper if none is saved
    setWallpaper(null);
  }
});

function installApp(appZipUrl) {
  alert(
    "App installation is not supported in the browser-only version. Please copy the app folder to apps/."
  );
}
function uninstallApp(appName) {
  alert(
    "App uninstall is not supported in the browser-only version. Please delete the app folder from apps/."
  );
}
