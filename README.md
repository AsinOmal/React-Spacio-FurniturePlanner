# Spacio — Furniture Planner

> **Build beautiful spaces at the speed of thought.**
> A clean, precise web application for designing rooms in 2D and previewing them in real-time 3D — from bare walls to fully furnished spaces, in minutes.

![Landing Page](./src/assets/landing-preview.png)

---

## ✨ Features

### 🏠 Room Configuration
- Set room **width and length** from 1–20 metres
- Choose between three **room shapes**: Rectangle, Square, L-Shape
- Pick custom **wall** and **floor colours** via colour pickers
- **Live preview** canvas updates in real-time as you configure

### ✏️ 2D Design Editor
- **Furniture Library** — one-click addition of 8 furniture types (Chair, Dining Table, Sofa, Bed, Side Table, Wardrobe, Desk, Bookshelf)
- **Drag & Drop** positioning — freely drag furniture anywhere on the floor plan
- **Snap to Grid** — optionally snap furniture to a precise grid for aligned layouts
- **Rotation** — rotate any item 0–355° via a properties slider
- **Scale** — uniformly resize items from 0.5× to 2.5× via slider
- **Colour Picker** — per-item colour customisation
- **Transformer Handles** — visual corner handles for resizing directly on the canvas
- **Measurement Ruler Lines** — precise metric rulers along the canvas edges
- **Grid Overlay** — toggleable background grid
- **Item Labels** — toggleable type labels rendered on each furniture piece
- **Undo / Redo** — full undo/redo history (Ctrl+Z / Ctrl+Y or Cmd+Z / Cmd+Y)
- **Delete Key** — remove selected item with the Delete or Backspace key
- **Zoom** — scroll-wheel zoom in/out (Ctrl+Scroll), + / – buttons, and click-to-reset zoom percentage HUD
- **Fit to Screen** — auto-fits the room plan to the available viewport on load
- **PDF Export** — exports your 2D plan, room statistics, and a full Furniture Bill of Materials into a printable PDF
- **Export PNG** — exports the current canvas layout as a high-resolution PNG

### 🧊 3D Room Preview
- Real-time **three.js powered** 3D rendering of your room
- All furniture pieces are placed and scaled accurately from your 2D layout
- **Per-type 3D heights** for realistic proportions (Wardrobe 1.85m, Chair 0.9m, etc.)
- **L-Shape** room geometry renders correctly in 3D
- **Orbit controls** — click and drag to orbit, scroll to zoom
- **First-Person Walkthrough** — toggle "Walk Mode" to drop to floor level and look/walk around using WASD and your mouse (FPS style)
- **Walls Toggle** — optionally hide the 3D walls for an open-air blueprint view of your layout
- Accurate wall, floor, and ceiling materials using your chosen colours

### 💾 Design Management (Dashboard)
- **Save designs** with a custom name
- **View all saved designs** on the My Designs dashboard
- **Open and resume** any previously saved design
- **Delete designs** with a premium confirmation modal

### 🔐 Authentication & Backend
- **Real Accounts** — secure user registration and login backed by MongoDB and bcryptjs
- **Stateless JWT** — JSON Web Tokens used for secure, stateless API communication
- **Guest / Demo Mode** — start designing without creating an account
- Clean inline **AuthModal** for Sign In, Sign Up, or Guest Mode — no page redirects
- Session-aware Navbar: shows "My Designs" and "Sign Out" when logged in

### 🌙 Dark Mode
- Full **dark mode** support with a one-click toggle in every navbar
- All components — Landing, Dashboard, Room Setup, 2D Editor, 3D Preview — respect the active theme
- Token-based CSS variables ensure consistent colour application everywhere

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) |
| **Backend Framework** | [Express.js](https://expressjs.com/) on Node.js |
| **Database** | [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/) |
| **Authentication** | JSON Web Tokens (JWT) + bcryptjs |
| **Build Tool** | [Vite 7](https://vitejs.dev/) |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) |
| **2D Canvas** | [Konva](https://konvajs.org/) + [React Konva](https://konvajs.org/docs/react/) |
| **PDF Generation** | [jspdf](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) |
| **3D Rendering** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + [@react-three/drei](https://github.com/pmndrs/drei) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Styling** | Vanilla CSS with CSS custom properties (design token system) |

---

## 📁 Project Structure

```
furniture-planner/
├── public/
├── src/
│   ├── components/           # Shared, reusable UI components
│   │   ├── Navbar.jsx        # Global sticky navigation bar
│   │   ├── Navbar.css
│   │   ├── AuthModal.jsx     # Inline sign-in / guest mode modal
│   │   ├── AuthModal.css
│   │   ├── DeleteModal.jsx   # Premium delete confirmation dialog
│   │   └── SaveModal.jsx     # Save design name dialog
│   ├── context/
│   │   └── DesignContext.jsx # Global state: room config, furniture, designs
│   ├── pages/
│   │   ├── Landing.jsx       # Home / marketing page
│   │   ├── Landing.css
│   │   ├── Dashboard.jsx     # My Designs grid
│   │   ├── Dashboard.css
│   │   ├── RoomSetup.jsx     # Room configuration (dimensions, shape, colours)
│   │   ├── RoomSetup.css
│   │   ├── Editor2D.jsx      # Main 2D drag-and-drop editor
│   │   ├── Editor2D.css
│   │   ├── Preview3D.jsx     # Three.js 3D room preview
│   │   ├── Preview3D.css
│   │   ├── Login.jsx         # Standalone login page (legacy)
│   │   └── Login.css
│   ├── App.jsx               # Root router
│   ├── index.css             # Global CSS design tokens + utility classes
│   └── main.jsx              # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/AsinOmal/React-Spacio-FurniturePlanner.git
cd React-Spacio-FurniturePlanner

# 2. Install Frontend dependencies
npm install

# 3. Install Backend dependencies
cd server
npm install

# 4. Configure Backend Environment
# Create a .env file in the `server` directory with the following:
PORT=5005
MONGODB_URI=mongodb://localhost:27017/spacio
JWT_SECRET=your-secure-secret-key

# 5. Start the Backend server (in the server/ directory)
npm run dev

# 6. Open a new terminal window in the project root and start the Frontend
npm run dev
```

The app will be available at **http://localhost:5173**

### Docker Installation (Recommended)

To run the entire MERN stack (MongoDB, Node Backend, Nginx Frontend) in an isolated containerized environment:

```bash
# Ensure Docker is running, then execute:
docker compose up --build -d
```

The app will be available at **http://localhost**

### Build for Production

```bash
npm run build
```

The optimized output will be in the `dist/` directory. Serve it with:

```bash
npm run preview
```

---

## 🔑 Demo Credentials

| Username | Password |
|---|---|
| `designer` | `furniture123` |

> **Tip:** You can also click **"Continue as Guest (Demo Mode)"** on the login modal to skip authentication entirely and jump straight into the editor.

---

## 🗺 Application Flow

```
Landing Page
    │
    ├─ Sign In → AuthModal → Dashboard
    │                            │
    └─ Guest Mode ──────────┐    └─ + New Design → Room Setup
                            │                           │
                            └───────────────────────────┘
                                                        │
                                                  2D Editor
                                                  ┌───┴────┐
                                             Save │        │ 3D
                                                  │        ▼
                                             Dashboard  3D Preview
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete` / `Backspace` | Remove selected furniture item |
| `Ctrl + Scroll` | Zoom in / out on the canvas |

---

## 🎨 Design System

Spacio uses a CSS custom property (variable) token system defined in `src/index.css`. All components reference these tokens for consistent theming across light and dark modes.

| Token | Purpose |
|---|---|
| `--s-text` | Primary text colour |
| `--s-text-2` | Secondary/muted text |
| `--s-surface` | Card and panel backgrounds |
| `--s-surface-2` | Slightly elevated surface |
| `--s-accent` | Bronze highlight colour |
| `--s-border` | Subtle border colour |
| `--s-danger` | Red for destructive actions |
| `--f-serif` | Playfair Display (headings/logo) |
| `--f-sans` | Inter (body text/UI) |
| `--r-md` / `--r-lg` | Border radius tokens |

Dark mode is activated by toggling the `html.dark` class, swapping all token values automatically.

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.0 | UI framework |
| `react-router-dom` | ^7.13.0 | Client-side routing |
| `konva` | ^10.2.0 | Canvas rendering engine |
| `react-konva` | ^19.2.2 | React bindings for Konva |
| `three` | ^0.183.1 | 3D rendering engine |
| `@react-three/fiber` | ^9.5.0 | React renderer for Three.js |
| `@react-three/drei` | ^10.7.7 | Three.js helpers (OrbitControls, etc.) |
| `lucide-react` | ^0.575.0 | SVG icon library |
| `vite` | ^7.3.1 | Development server & bundler |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">Built with ❤️ using React, Konva, and Three.js</p>
