# Interactive Mesh Cutter

**Name:** Rahul Gopalan
**SRN:** PES1UG23CS462

## Overview
This project is a web-based 3D simulation that allows users to interactively slice a deformable mesh (a rug) in real-time. Built with **React 19**, **Three.js**, and **Cannon.js**, it combines computational geometry with rigid body physics. When a user slices the mesh, the application mathematically recalculates the geometry, splits the triangles, and generates new independent physics bodies that fall and interact under gravity.

## 🚀 How to Run

1. **Install Dependencies**
   ```bash
   npm install
````

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. Open your browser (usually at `http://localhost:5173`).

## User Instructions

1. **Enter Cut Mode:** Click the "Enter Cut Mode" button in the top right. The button will turn red.
2. **Slice:** Click and drag your mouse across the rug to draw a red cut line.
3. **Release:** Release the mouse button to execute the cut.
4. **Reset:** Click "Reset" to restore the rug.

> **⚠️ Note on Cutting:**
> Cutting relies on precise mouse movement and geometry calculations. Very short or unclear cut lines may not produce a clean split.

---

## Project Structure (Simplified)

### **/services**

* **meshCutter.ts**
  Handles slicing the mesh and returning the resulting pieces.

### **/components**

* **RugPiece.tsx**
  Renders a single rug piece, applies physics, and captures mouse input to draw cut lines.

* **Scene.tsx**
  Sets up the 3D scene, lighting, physics world, and renders all rug pieces.

### **Root**

* **App.tsx**
  Main application file. Manages global state and UI controls (Cut Mode / Reset), and renders the scene.

---

## 🛠 Tech Stack

* **Frontend:** React 19, TypeScript, Vite
* **3D Engine:** Three.js, React Three Fiber
* **Physics:** Cannon.js (@react-three/cannon)
* **Styling:** Tailwind CSS


