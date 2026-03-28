# PIXELRIFT — 50 Vanilla JS Games

![PIXELRIFT Platform](https://rizvee.github.io/PIXELRIFT/assets/img/icon-512.png)

**PIXELRIFT** is a high-performance, open-source arcade portal featuring 50 browser-playable games built entirely with **pure HTML, CSS, and Vanilla JavaScript**. No frameworks. No build steps. Zero dependencies.

## 🚀 Key Features

- **50 Unique Titles**: From arcade classics and physics simulations to cellular automata and experimental art.
- **60FPS+ Optimization**: Hardened with **Object Pooling** and **Batched Canvas Operations** to ensure smooth performance even with 1000+ active entities.
- **PWA Ready**: Fully offline-capable via a lazy-loading Service Worker. Play your favorite games on a flight or with zero connectivity.
- **Retro-Engineering Aesthetic**: Unified visual polish featuring a CSS-only CRT scanline overlay and chromatic aberration "impact glitch" effects.
- **SEO Optimized**: Complete JSON-LD schema, metadata, and automated sitemap for maximum search engine indexability (#1 SERP target).

## 🛠 Tech Stack

- **Core**: Vanilla JavaScript (ES6+)
- **Graphics**: HTML5 Canvas 2D API (Optimized)
- **Styling**: Modern CSS (Custom Reset, Glassmorphism, CSS Variables)
- **Architecture**: Hub & Spoke (Central catalog engine + independent game modules powered by `PixelRiftEngine`)

## 🏗 Common Engine Core (`engine.js`)

To ensure a seamless experience across all hardware, the platform uses a unified engine module that abstracts:
- **High-DPI (Retina) Scaling**: Automatically adjusts canvas resolution to the device's `devicePixelRatio` for razor-sharp visuals on modern phones and laptops.
- **Fixed-Timestep Physics**: Decouples game logic from the monitor's refresh rate (Delta Time). Play comfortably on 60Hz, 120Hz, or 144Hz displays.
- **Unified Persistence**: Standardized high-score management using `localStorage`.

## ⚡ Performance Optimizations

To maintain a locked 60fps across all devices, we've implemented several advanced patterns:

- **Object Pooling**: Pre-allocated arrays for entities (bullets, particles, segments) to prevent Garbage Collector stutter.
- **Batched Rendering**: Grouped `stroke()` and `fill()` calls to minimize expensive Canvas state changes.
- **DOM Decoupling**: HUD and score elements are drawn directly on-canvas, eliminating DOM layout shifts during gameplay.
- **Shadow Removal**: High-cost `shadowBlur` effects have been replaced with layered radial gradients for efficient "fake" glows.

## 📦 Installation & Deployment

Since PIXELRIFT is entirely static, deployment is as simple as hosting the root directory.

1. **Local Development**:
   ```bash
   # Use any static server (e.g., Python, Node serve, or Live Server)
   npx serve .
   ```
2. **GitHub Pages**:
   Simply push to your main branch. The project is pre-configured for GitHub Pages sub-directories.

## 📜 License

Built with ❤️ by [Hasan Rizvee](https://github.com/rizvee).  
Open Source under the **MIT License**.
