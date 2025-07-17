# webOS

## Directory Structure

```
webOS/
  apps/
    calculator/
      index.html
      index.js
      index.css
      icon.png
      manifest.json
    text-editor/
      index.html
      index.js
      index.css
      icon.png
      manifest.json
    wallpaper-changer/
      index.html
      index.js
      index.css
      icon.png
      manifest.json
  core/
    boot.js
    taskbar.js
    window-manager.js
  assets/
    icons/
    wallpapers/
  css/
    global.css
    os-ui.css
  js/
    main.js
    utils.js
  index.html
  README.md
```

## App Manifest Format

Each app must have a `manifest.json` file:

```
{
  "name": "App Name",
  "icon": "icon.png",
  "entry": "index.html"
}
```

## Conventions

- Each app is self-contained in its own folder.
- Use `index.html`, `index.js`, `index.css` for entry points.
- App icon should be named `icon.png` inside the app folder.
- Apps are loaded dynamically by reading their manifest files.
- Shared utilities go in `js/utils.js`.

## App Sandboxing & Communication

- Each app runs in a sandboxed iframe for security and isolation.
- Apps can communicate with the OS using the `window.postMessage` API.
- Example protocol:
  - OS → App: `{ type: "webos-handshake", appName }`
  - App → OS: `{ type: "webos-notify", text: "..." }`
- To send a notification from your app:
  ```js
  window.parent.postMessage(
    { type: "webos-notify", text: "Hello from app!" },
    "*"
  );
  ```
- The OS will listen for messages and can respond or trigger actions as needed.

## OS API/SDK for Apps

Apps can interact with the OS using a secure postMessage-based API. On load, send a handshake to the OS:

```js
window.parent.postMessage({ type: "webos-handshake-app" }, "*");
```

The OS will respond with available API capabilities:

```js
// Example response
{
  type: "webos-api",
  api: {
    notify: true,
    // ...more capabilities
  }
}
```

To show a notification from your app:

```js
window.parent.postMessage(
  { type: "webos-notify", text: "Hello from app!" },
  "*"
);
```

You can extend this protocol for more OS features (open/close window, settings, etc.).

## How to Add a New App

1. Create a new folder in `apps/` (e.g., `apps/my-app/`).
2. Add your app files: `index.html`, `index.js`, `index.css`, and `icon.png`.
3. Add a `manifest.json` file:
   ```json
   {
     "name": "My App",
     "icon": "icon.png",
     "entry": "index.html"
   }
   ```
4. Your app will be auto-discovered and available in the OS UI.

## Manifest Usage

- Each app must have a `manifest.json` describing its name, icon, and entry point.
- The OS reads this file to show the app in the UI and launch it in a sandboxed window.

## Contribution Guidelines

- Keep each app self-contained in its own folder.
- Use the provided manifest format.
- Follow code style (see `.eslintrc.json`).
- Test your app in both desktop and mobile views.
- For new features or bugfixes, open a pull request with a clear description.

## Desktop Management

### App Visibility

- System apps can be hidden from the desktop by right-clicking and selecting "Hide from Desktop"
- Hidden apps can be restored by right-clicking on the desktop and selecting "Show Hidden Apps"
- The Wallpaper Changer app is hidden by default on first load

### Desktop Icons

- Right-click on desktop icons to access context menu options
- System apps: "Hide from Desktop", "Remove from Desktop"
- User files/folders: "Rename", "Delete", "Duplicate"
- Desktop icons can be dragged and repositioned
- Icon positions are saved automatically

## Wallpaper Management

### Adding New Wallpapers
- **Automatic Detection**: Simply copy wallpaper files to `assets/wallpapers/` folder and refresh the app
- **Supported Formats**: JPG, PNG, GIF, WebP, BMP
- **File Size Limit**: 10MB per wallpaper
- **Smart Naming**: System automatically generates names from filenames
- **Auto Icons**: Icons are automatically assigned based on filename keywords

### Quick Steps:
1. Copy wallpaper files to `assets/wallpapers/`
2. Open Wallpaper Changer app
3. Click the 🔄 refresh button
4. New wallpapers will appear automatically

### Smart Features:
- **Keyword Detection**: `nature_forest.jpg` → 🌲 icon
- **Name Generation**: `spider_man_4k.jpg` → "Spider Man"
- **Auto Refresh**: Detects new files automatically
- **Error Handling**: Shows loading states and error messages

For detailed instructions, see `WALLPAPER_GUIDE.md`

## Simple Package Management (Install/Uninstall Apps)

- To install a new app: Copy the app folder (with manifest, index.html/js/css, icon) into the `apps/` directory.
- To uninstall an app: Delete the app's folder from `apps/`.
- (Browser-only version does not support automatic install/uninstall. In the future, a UI for app management can be added.)
