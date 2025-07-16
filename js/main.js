// js/main.js
const webOSState = {
  openAppWindows: {},
  notifications: [],
  settings: {},
};

window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  updateClock();
  const appGrid = document.getElementById("appGrid");
  let zIndexCounter = 3000;
  const taskbarApps = document.getElementById("taskbarApps");
  const desktopIconsContainer = document.getElementById("desktopIcons");
  console.log("desktopIconsContainer:", desktopIconsContainer);

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
  function loadDesktopItems() {
    try {
      const saved = localStorage.getItem("webos-desktop-items");
      if (saved) desktopItems = JSON.parse(saved);
    } catch {}
  }
  function saveDesktopItems() {
    try {
      localStorage.setItem("webos-desktop-items", JSON.stringify(desktopItems));
    } catch {}
  }

  // --- Render Desktop Icons (Apps + Files/Folders) ---
  function renderDesktopIcons(apps) {
    console.log("renderDesktopIcons called", apps, desktopItems);
    desktopIconsContainer.innerHTML = "";
    const gapX = 16,
      gapY = 16,
      iconW = 72,
      iconH = 80;
    let col = 0,
      row = 0,
      maxRows = Math.floor(window.innerHeight / (iconH + gapY));
    // Render app icons
    apps.forEach((app, i) => {
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
      console.log("Added desktop icon", item);
    });
    saveDesktopIconPositions();
    saveDesktopItems();
  }

  function setActiveTaskbarIcon(appPath) {
    Array.from(taskbarApps.children).forEach((btn) => {
      if (btn.dataset.appPath === appPath) btn.classList.add("active");
      else btn.classList.remove("active");
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

  function ensureTaskbarIcon({ appName, appIcon, appPath }) {
    let btn = taskbarApps.querySelector(`[data-app-path="${appPath}"]`);
    if (!btn) {
      btn = document.createElement("button");
      btn.className = "taskbar-app";
      btn.dataset.appPath = appPath;
      btn.title = appName;
      btn.innerHTML = appIcon;
      btn.addEventListener("click", () => {
        if (webOSState.openAppWindows[appPath]) {
          webOSState.openAppWindows[appPath].forEach((win) => {
            win.style.display = "flex";
            win.style.zIndex = ++zIndexCounter;
          });
          setActiveTaskbarIcon(appPath);
        }
      });
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showTaskbarContextMenu(appPath, e.clientX, e.clientY);
      });
      taskbarApps.appendChild(btn);
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
    // Remove forced fullscreen on mobile
    // const isMobile = window.innerWidth <= 600;
    // if (isMobile) {
    //   win.classList.add("fullscreen");
    // } else {
    win.style.left = `${60 + Math.random() * 100}px`;
    win.style.top = `${80 + Math.random() * 80}px`;
    win.style.width = "500px";
    win.style.height = "400px";
    // }
    win.style.zIndex = ++zIndexCounter;
    win.style.display = "flex";
    win.style.flexDirection = "column";
    win.style.position = "fixed";
    win.style.animation = "fadeIn 0.2s";

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
        win.style.left = e.clientX - offsetX + "px";
        win.style.top = e.clientY - offsetY + "px";
      }
    });
    document.addEventListener("mouseup", function () {
      isDragging = false;
      document.body.style.userSelect = "";
    });

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
        }
      }
    });
    minBtn.addEventListener("click", () => {
      win.style.display = "none";
    });
    maxBtn.addEventListener("click", () => {
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
    });
    win.addEventListener("dblclick", () => {
      win.style.display = "flex";
      zIndexCounter++;
      win.style.zIndex = zIndexCounter;
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
    desktopContextMenu.innerHTML = `
      <div class="context-menu-item" data-action="create-file">Create File</div>
      <div class="context-menu-item" data-action="create-folder">Create Folder</div>
      <hr class="context-menu-separator" />
      <div class="context-menu-item" data-action="change-wallpaper">Change Wallpaper</div>
      <div class="context-menu-item" data-action="view-settings">View Settings</div>
      <hr class="context-menu-separator" />
      <div class="context-menu-item" data-action="refresh">Refresh</div>
    `;
    document.body.appendChild(desktopContextMenu);
    // Debug: log parent and position
    console.log("Menu parent:", desktopContextMenu.parentElement);
    // Positioning
    desktopContextMenu.style.position = "fixed";
    desktopContextMenu.style.left = x + "px";
    desktopContextMenu.style.top = y + "px";
    desktopContextMenu.style.bottom = "";
    console.log("Menu position:", x, y);
    // Prevent menu from closing on its own click
    desktopContextMenu.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    // Action handling
    desktopContextMenu.addEventListener("click", function (e) {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      const action = item.getAttribute("data-action");
      console.log("Context menu action:", action);
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
      console.log("Patched renderDesktopIcons called", apps);
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
    console.log("Patched renderDesktopIcons");
  }
  patchRenderDesktopIcons();
  renderDesktopIcons(loadedApps);
  console.log("Calling renderDesktopIcons after patch");

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
    console.log("Desktop context menu opened");
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
    if (selected.length === 1)
      menu +=
        '<div class="context-menu-item" data-action="rename">Rename</div>';
    menu += '<div class="context-menu-item" data-action="delete">Delete</div>';
    menu +=
      '<div class="context-menu-item" data-action="duplicate">Duplicate</div>';
    iconContextMenu.innerHTML = menu;
    document.body.appendChild(iconContextMenu);
    // Debug: log parent and position
    console.log("Icon menu parent:", iconContextMenu.parentElement);
    iconContextMenu.style.position = "fixed";
    iconContextMenu.style.left = x + "px";
    iconContextMenu.style.top = y + "px";
    iconContextMenu.style.bottom = "";
    console.log("Icon menu position:", x, y);
    iconContextMenu.addEventListener("mousedown", (e) => e.stopPropagation());
    iconContextMenu.addEventListener("click", function (e) {
      const item = e.target.closest(".context-menu-item");
      if (!item) return;
      const action = item.getAttribute("data-action");
      console.log("Icon context menu action:", action);
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
      } else if (action === "delete") {
        if (!confirm("Delete selected item(s)?")) return;
        // Remove from desktopItems
        let ids = selected.map((icon) => icon.dataset.itemId).filter(Boolean);
        desktopItems = desktopItems.filter((item) => !ids.includes(item.id));
        saveDesktopItems();
        renderDesktopIcons(loadedApps);
        clearSelection();
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
    desktop.style.backgroundImage = url ? `url('${url}')` : "";
    desktop.style.backgroundSize = "cover";
    desktop.style.backgroundPosition = "center";
    desktop.style.backgroundRepeat = "no-repeat";
    webOSState.settings.wallpaper = url;
    saveSettings();
  }
}

window.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== "object" || !msg.type) return;
  if (msg.type === "webos-set-wallpaper" && msg.url) {
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
