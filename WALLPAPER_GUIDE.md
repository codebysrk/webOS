# 🎨 Wallpaper Guide - नए Wallpapers कैसे Add करें

## 📁 **Method 1: Automatic Detection (Recommended)**

### **Step 1: Wallpaper Files को Add करें**

1. `assets/wallpapers/` folder में जाएं
2. अपनी wallpaper images को इस folder में copy करें
3. Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

### **Step 2: App को Refresh करें**

1. Wallpaper Changer app open करें
2. Built-in Wallpapers section में 🔄 button पर click करें
3. नए wallpapers automatically detect हो जाएंगे

### **Step 3: Smart Naming**

- Filename से automatically wallpaper name generate होता है
- Example: `nature_forest_4k.jpg` → "Nature Forest"
- Numbers और special characters automatically remove होते हैं

## 🎯 **Method 2: Manual Configuration**

### **Step 1: Code में Add करें**

`apps/wallpaper-changer/index.js` में जाएं और `builtInWallpapers` array में add करें:

```javascript
{
  name: "Your Wallpaper Name",
  filename: "your-wallpaper.jpg",
  icon: "🌲" // Choose appropriate icon
}
```

### **Step 2: Icon Selection**

Available icons:

- 🏠 Default
- 🕷️ Spider-Man
- 🍩 Cartoons
- 🌲 Nature
- 🚀 Space
- 🌸 Anime
- 🎮 Gaming
- 🎨 Abstract
- ⚪ Minimal
- 🌙 Dark
- ☀️ Light
- 🌊 Ocean
- 🏔️ Mountain
- 🌳 Forest
- 🏙️ City
- 🌅 Sunset
- 🌄 Sunrise
- 🌃 Night
- 🌞 Day
- ❄️ Winter
- 🍂 Autumn

## 📋 **Naming Conventions**

### **Smart Auto-Detection**

System automatically detects keywords और appropriate icons assign करता है:

| Keyword              | Icon | Example Filename       |
| -------------------- | ---- | ---------------------- |
| nature, forest, tree | 🌲   | `nature_forest.jpg`    |
| space, galaxy, star  | 🚀   | `space_galaxy.jpg`     |
| anime, cartoon       | 🌸   | `anime_character.jpg`  |
| game, gaming         | 🎮   | `gaming_setup.jpg`     |
| abstract, art        | 🎨   | `abstract_art.jpg`     |
| minimal, simple      | ⚪   | `minimal_design.jpg`   |
| dark, night          | 🌙   | `dark_theme.jpg`       |
| light, day           | ☀️   | `light_theme.jpg`      |
| ocean, sea, water    | 🌊   | `ocean_waves.jpg`      |
| mountain, hill       | 🏔️   | `mountain_peak.jpg`    |
| city, urban          | 🏙️   | `city_skyline.jpg`     |
| sunset, dusk         | 🌅   | `sunset_beach.jpg`     |
| sunrise, dawn        | 🌄   | `sunrise_mountain.jpg` |

## 🔧 **Advanced Configuration**

### **Custom Icons**

अगर आप custom icon चाहते हैं तो `wallpaperIcons` object में add करें:

```javascript
const wallpaperIcons = {
  "your-keyword": "🎯",
  // ... existing icons
};
```

### **File Size Limits**

- Maximum file size: 10MB
- Recommended resolution: 1920x1080 या higher
- Supported formats: JPG, PNG, GIF, WebP, BMP

## 🚀 **Quick Start Guide**

### **1. Add Wallpaper**

```bash
# Copy your wallpaper to assets folder
cp your-wallpaper.jpg assets/wallpapers/
```

### **2. Refresh App**

- Wallpaper Changer app open करें
- 🔄 button click करें
- Done! 🎉

### **3. Use Wallpaper**

- Built-in wallpapers में से कोई select करें
- "Apply Wallpaper" click करें
- Wallpaper change हो जाएगा!

## 📝 **Tips & Best Practices**

### **File Naming**

- ✅ `nature_forest_4k.jpg`
- ✅ `space_galaxy_ultra_hd.png`
- ✅ `minimal_abstract_art.jpg`
- ❌ `IMG_2024_01_15_123456.jpg`
- ❌ `wallpaper1.jpg`

### **Image Quality**

- High resolution (1920x1080+)
- Good compression (file size < 5MB)
- Proper aspect ratio (16:9 recommended)

### **Organization**

- Similar wallpapers को similar names दें
- Keywords use करें जो content describe करें
- Avoid generic names

## 🔄 **Troubleshooting**

### **Wallpaper नहीं दिख रहा**

1. File format check करें
2. File size check करें (< 10MB)
3. Refresh button click करें
4. Browser console में errors check करें

### **Icon नहीं दिख रहा**

1. Filename में keywords check करें
2. Manual icon configuration करें
3. Default icon (🖼️) automatically assign होगा

### **Performance Issues**

1. Large files को compress करें
2. Resolution optimize करें
3. WebP format use करें (better compression)

## 📞 **Support**

अगर कोई समस्या है तो:

1. Console में errors check करें
2. File permissions verify करें
3. File format validate करें
4. Refresh button try करें

---

**Happy Wallpaper Customization! 🎨✨**
