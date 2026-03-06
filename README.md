# Micelio 3D

Micelio 3D is an immersive React + React Three Fiber scene that visualizes a living mycelium network as an evolving node constellation. The hero introduces the project with a looping Embla carousel shrouded in translucent fog, while the canvas below animates glowing nodes, flowing connections, volumetric bloom, and a vignette that intensifies the nocturnal mood.

## Key Characteristics
- **Living node field:** Every frame rebuilds a procedural network of nodes and flowing lines that slowly densify, simulating growth as `maxNodes` ramps up over time.
- **Immersive effects:** Ambient fog, Bloom/Noise/Vignette post-processing, drifting particles, and layered gradients keep the space mysterious, while the hero fog and vignette mirror the canvas lighting.
- **Interactive focus:** Clicking a node stores the current camera snapshot, animates `CameraControls` toward the selected node, and restores the snapshot when closing the node card so the viewer returns to their prior vantage.
- **Audio safety:** Audio is gated until an intentful gesture enables Tone.js, and a floating `Enable audio` button stays visible until the context is ready.
- **Ambient soundtrack control:** A hosted AWS S3 MP3 powers the ambient score; the hero CTA restarts that audio along with the procedural network, and dedicated Pause/Restart buttons stay fixed over the canvas so listeners can silence or replay the loop.
- **Hero carousel:** The hero heroically blends photography of mycelium fragments into a carousel, inviting the user to “Revisa el micelio” before descending into the scene.

## Running Locally
1. **Install dependencies** (requires Node.js 18+):

```
npm install
```

2. **Start the dev server:**

```
npm run dev
```

3. **Preview:** Open the address shown in the terminal (usually `http://localhost:5173`) in a Chromium-based browser to ensure WebGL and audio permissions behave correctly.

4. **Optional:** If you bump into audio restrictions, click or tap anywhere in the scene until the floating `Enable audio` button disappears.

The project uses Vite for bundling and React Three Fiber for rendering; reloading the page resets the scene seed and camera snapshot.

## Media Guidelines
- Keep large textures, video loops, and audio stems outside the repository and deliver them via a CDN or storage bucket; the project ignores common media extensions and placeholder folders, as defined in [.gitignore](.gitignore).

Changed user