// js/main.js
window.onload = () => {
  updateClock();
  const appGrid = document.getElementById("appGrid");
  let zIndexCounter = 3000;
  const taskbarApps = document.getElementById("taskbarApps");
  const webOSState = {
    openAppWindows: {},
    notifications: [],
    settings: {},
  };

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
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      win.classList.add("fullscreen");
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
};

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

window.addEventListener("DOMContentLoaded", async () => {
  const apps = await loadAppManifests();
  // Use 'apps' to populate taskbar, start menu, etc. (future enhancement)
});

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
