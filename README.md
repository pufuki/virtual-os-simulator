# Virtual OS Architecture Simulator

An interactive web-based simulator for visualizing core operating system and computer architecture concepts. It simulates CPU instruction execution, cache hits/misses, RAM access, bus signals, interrupts, DMA transfers, process scheduling, and I/O devices in real time with audio-visual feedback.

## Demo

<video src="assets/video.mp4" controls width="100%"></video>

## Features

- Interactive Motherboard Layout: Zoom, pan, and inspect individual components.
- Live Simulation Controls: Play, pause, step forward, adjust speed from 0.1x to 20x, and toggle audio feedback.
- Real-time Signal Visualization: Animated signals flowing through dedicated bus tracks with synthesized audio.
- Event Injection: Trigger keyboard/disk/mouse interrupts, page faults, cache misses, DMA transfers, system calls, GPU renders, and process lifecycle events.
- Component Detail Panels: Inspect CPU pipeline, registers, cache levels, memory layout, process scheduler, and device states.
- Live Event Log and System Stats: Monitor cycle count, program counter, cache hit rate, and active processes.

## Getting Started

### Prerequisites

Node.js (version 18 or higher) and npm.

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/os-simulator.git
   cd os-simulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## Available Scripts

- `npm run dev`: Start Vite development server.
- `npm run build`: Build production bundle into dist/.
- `npm run preview`: Preview production build locally.
- `npm run typecheck`: Run TypeScript type checking.
- `npm run lint`: Run ESLint checks.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Web Audio API

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository and create a new feature branch.
2. Ensure your changes pass type checking (`npm run typecheck`) and linting (`npm run lint`).
3. Verify that production builds succeed (`npm run build`).
4. Open a pull request describing your changes clearly.

## License

MIT
