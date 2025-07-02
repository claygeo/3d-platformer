# Cube Hopper – 3D Platformer in Three.js

> **Hop across floating blocks, grab every coin, and dodge deadly traps – all in your browser with no installs.**

## Table of Contents

* [About](#about)
* [Features](#features)
* [Play Now](#play-now)
* [Controls](#controls)
* [Getting Started (Dev)](#getting-started-dev)
* [Folder Structure](#folder-structure)

---

## About

**Cube Hopper** is my original 3-D platformer proof-of-concept built with **[Three.js r128](https://threejs.org)** and vanilla JavaScript.  It was born as a playground for learning WebGL camera tricks, level design, and game-feel polish – then it grew into a full mini-game with scoring, lives, and level progression.

Everything you see – UI, particle effects, loaders, and game logic – lives in a single HTML page and a handful of ES modules.  No bundler required.

---

## Features

| Description                                                                                              |
|--------------------------------------------------------------------------------------------------------- |
|Responsive WASD movement with **run & jump** physics                                                      |
|Three **camera modes**: *Free Orbit*, *Over-the-Shoulder Follow*, *Fixed Overlook* (toggle with **C**)    |
|Collect **gold, silver, bronze coins**, plus hearts, gems, and keys – each with particle VFX              |
|Dynamic **hazards** – spikes, saw blades, rolling spike balls, moving crushers                            |
|**Moving platforms & bridges** with tweened paths                                                         |
|Two handcrafted demo levels – *Enchanted Garden Towers* & *Industrial Sky City*                           |
|Real-time shadows, bloom & fog for atmosphere                                                             |
|HUD tracking **score, lives, coins & level** in a glass-morphism overlay                                  |

---

## Play Now

1. **Clone / Download** this repo.
2. Double-click **`index.html`** *(works offline)*.

   * For audio / CORS sanity, serve locally:

     ```bash
     npx serve .
     # or
     python -m http.server 8080
     ```
3. Enjoy the hop.

---

## Controls

| Action        | Key                  |
| ------------- | -------------------- |
| Move          | **W A S D / Arrows** |
| Run           | **Shift**            |
| Jump          | **Space**            |
| Restart level | **R**                |
| Next level    | **N**                |
| Pause / Menu  | **Esc**              |
| Toggle camera | **C**                |
| Focus player  | **F**                |

---

## Getting Started (Dev)

```bash
# Clone
 git clone https://github.com/claygeo/cube-hopper.git
 cd cube-hopper

# Serve (recommended for audio)
 npx serve .

# Hack away – source lives in /js
```

Dependencies are loaded via CDN (Three.js, GLTFLoader).  For a bundled build with tree-shaking, check the **/build** branch (Vite).

### Folder Structure

```
.
├── index.html
├── /js
│   ├── game.js           # Game loop & state manager
│   ├── player.js         # Player controller
│   ├── camera.js         # Camera modes
│   └── levels/           # JSON-like level descriptors
├── /assets
│   ├── models/
│   ├── textures/
│   ├── audio/
│   └── screenshots/
└── README.md
```

