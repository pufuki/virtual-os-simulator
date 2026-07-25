import type { BusPath, ComponentNode, ComponentId } from './types';

// The virtual motherboard is laid out on a 2200x1450 logical canvas.
// Generous gaps (channels) separate every zone so bus paths route cleanly
// through empty space — nothing crosses through a component.

export const WORLD_W = 2200;
export const WORLD_H = 1450;

// Container components (group regions with dashed borders, children inside)
export const CONTAINERS: ComponentId[] = ['cpu', 'systemBus'];

export const COMPONENTS: ComponentNode[] = [
  // ======== CPU container (top-left) ========
  { id: 'cpu', label: 'CPU', short: 'CPU', group: 'cpu', color: '#38bdf8',
    rect: { x: 60, y: 60, w: 620, h: 540 },
    purpose: 'Central Processing Unit',
    detail: 'Fetches, decodes, and executes instructions. Drives the entire system.' },
  // CPU children — inside the CPU container with comfortable padding
  { id: 'controlUnit', label: 'Control Unit', short: 'CU', group: 'cpu', color: '#0ea5e9',
    rect: { x: 100, y: 110, w: 240, h: 100 },
    purpose: 'Directs operation of the processor',
    detail: 'Decodes instructions and generates control signals for all other CPU parts.' },
  { id: 'alu', label: 'ALU', short: 'ALU', group: 'cpu', color: '#22d3ee',
    rect: { x: 380, y: 110, w: 240, h: 100 },
    purpose: 'Arithmetic Logic Unit',
    detail: 'Performs arithmetic and logical operations on register data.' },
  { id: 'registers', label: 'Registers', short: 'REG', group: 'cpu', color: '#60a5fa',
    rect: { x: 100, y: 250, w: 520, h: 80 },
    purpose: 'General-purpose registers',
    detail: 'Fast storage locations R0-R7 holding operands and results.' },
  { id: 'pc', label: 'Program Counter', short: 'PC', group: 'cpu', color: '#818cf8',
    rect: { x: 100, y: 370, w: 160, h: 70 },
    purpose: 'Holds address of next instruction',
    detail: 'Updated each fetch cycle; jumps on branches.' },
  { id: 'ir', label: 'Instruction Register', short: 'IR', group: 'cpu', color: '#818cf8',
    rect: { x: 290, y: 370, w: 160, h: 70 },
    purpose: 'Holds current instruction',
    detail: 'Loaded during fetch; decoded by the Control Unit.' },
  { id: 'sp', label: 'Stack Pointer', short: 'SP', group: 'cpu', color: '#818cf8',
    rect: { x: 480, y: 370, w: 140, h: 70 },
    purpose: 'Top of stack address',
    detail: 'Tracks the current top of the runtime stack in memory.' },
  { id: 'clock', label: 'Clock', short: 'CLK', group: 'cpu', color: '#fbbf24',
    rect: { x: 100, y: 480, w: 160, h: 60 },
    purpose: 'System clock generator',
    detail: 'Produces the timing pulse that synchronizes every component.' },
  { id: 'timer', label: 'Timer', short: 'TMR', group: 'cpu', color: '#f59e0b',
    rect: { x: 290, y: 480, w: 160, h: 60 },
    purpose: 'Interval timer',
    detail: 'Fires periodic interrupts to enable time-slicing.' },

  // ======== Cache hierarchy (middle column) ========
  { id: 'l1', label: 'L1 Cache', short: 'L1', group: 'memory', color: '#34d399',
    rect: { x: 760, y: 110, w: 220, h: 130 },
    purpose: 'Level 1 cache (closest to CPU)',
    detail: 'Smallest, fastest cache. Checked first on every memory access.' },
  { id: 'l2', label: 'L2 Cache', short: 'L2', group: 'memory', color: '#10b981',
    rect: { x: 760, y: 280, w: 220, h: 130 },
    purpose: 'Level 2 cache',
    detail: 'Larger and slower than L1; backs up L1 misses.' },
  { id: 'l3', label: 'L3 Cache', short: 'L3', group: 'memory', color: '#059669',
    rect: { x: 760, y: 450, w: 220, h: 130 },
    purpose: 'Level 3 cache (shared)',
    detail: 'Shared across cores; backs up L2 misses before reaching RAM.' },

  // ======== RAM ========
  { id: 'ram', label: 'Main Memory (RAM)', short: 'RAM', group: 'memory', color: '#2dd4bf',
    rect: { x: 1060, y: 110, w: 340, h: 470 },
    purpose: 'Main memory',
    detail: 'Holds running program code and data. Addressed by the CPU.' },

  // ======== System Bus container ========
  { id: 'systemBus', label: 'System Bus', short: 'BUS', group: 'bus', color: '#94a3b8',
    rect: { x: 1480, y: 60, w: 200, h: 540 },
    purpose: 'System bus bundle',
    detail: 'The shared communication channel: address, data, and control lines.' },
  { id: 'addressBus', label: 'Address Bus', short: 'ADDR', group: 'bus', color: '#a78bfa',
    rect: { x: 1500, y: 110, w: 160, h: 130 },
    purpose: 'Carries memory addresses',
    detail: 'Unidirectional; CPU selects a memory or I/O location.' },
  { id: 'dataBus', label: 'Data Bus', short: 'DATA', group: 'bus', color: '#c084fc',
    rect: { x: 1500, y: 280, w: 160, h: 130 },
    purpose: 'Carries data',
    detail: 'Bidirectional; moves data between CPU, memory, and devices.' },
  { id: 'controlBus', label: 'Control Bus', short: 'CTRL', group: 'bus', color: '#e879f9',
    rect: { x: 1500, y: 450, w: 160, h: 130 },
    purpose: 'Carries control signals',
    detail: 'Read/Write, interrupt, and bus-request lines.' },

  // ======== Interrupt & DMA controllers ========
  { id: 'pic', label: 'Interrupt Controller', short: 'PIC', group: 'io', color: '#fb7185',
    rect: { x: 1760, y: 110, w: 200, h: 130 },
    purpose: 'Programmable Interrupt Controller',
    detail: 'Prioritizes interrupt requests and signals the CPU.' },
  { id: 'dma', label: 'DMA Controller', short: 'DMA', group: 'io', color: '#f472b6',
    rect: { x: 1760, y: 280, w: 200, h: 130 },
    purpose: 'Direct Memory Access',
    detail: 'Moves data between memory and devices without CPU intervention.' },

  // ======== I/O devices (far right column) ========
  { id: 'storage', label: 'Storage (Disk)', short: 'DISK', group: 'io', color: '#facc15',
    rect: { x: 2020, y: 110, w: 160, h: 130 },
    purpose: 'Persistent storage',
    detail: 'Block device holding the filesystem; slow compared to RAM.' },
  { id: 'nic', label: 'Network Card', short: 'NIC', group: 'io', color: '#4ade80',
    rect: { x: 2020, y: 280, w: 160, h: 130 },
    purpose: 'Network interface',
    detail: 'Sends and receives network packets via DMA.' },
  { id: 'gpu', label: 'GPU', short: 'GPU', group: 'io', color: '#818cf8',
    rect: { x: 2020, y: 450, w: 160, h: 130 },
    purpose: 'Graphics Processing Unit',
    detail: 'Renders the framebuffer; accessed via memory-mapped I/O.' },
  { id: 'keyboard', label: 'Keyboard', short: 'KBD', group: 'io', color: '#f87171',
    rect: { x: 1760, y: 450, w: 180, h: 70 },
    purpose: 'Keyboard input device',
    detail: 'Generates an interrupt on each keypress.' },
  { id: 'mouse', label: 'Mouse', short: 'MSE', group: 'io', color: '#fb923c',
    rect: { x: 1760, y: 540, w: 180, h: 60 },
    purpose: 'Mouse input device',
    detail: 'Generates interrupts on movement and clicks.' },

  // ======== Kernel / OS (bottom band) ========
  { id: 'kernel', label: 'Kernel', short: 'KERN', group: 'kernel', color: '#22d3ee',
    rect: { x: 60, y: 720, w: 320, h: 160 },
    purpose: 'Operating system kernel',
    detail: 'Manages processes, memory, and devices; handles system calls.' },
  { id: 'scheduler', label: 'Scheduler', short: 'SCHED', group: 'kernel', color: '#2dd4bf',
    rect: { x: 440, y: 720, w: 260, h: 160 },
    purpose: 'Process scheduler',
    detail: 'Picks the next process to run and performs context switches.' },
  { id: 'readyQueue', label: 'Ready Queue', short: 'READY', group: 'kernel', color: '#86efac',
    rect: { x: 760, y: 720, w: 280, h: 160 },
    purpose: 'Processes ready to run',
    detail: 'FIFO queue of processes waiting for the CPU.' },
  { id: 'waitingQueue', label: 'Waiting Queue', short: 'WAIT', group: 'kernel', color: '#fca5a5',
    rect: { x: 1120, y: 720, w: 280, h: 160 },
    purpose: 'Blocked processes',
    detail: 'Processes waiting on I/O or an event.' },
  { id: 'processes', label: 'Running Processes', short: 'PROC', group: 'kernel', color: '#67e8f9',
    rect: { x: 1480, y: 720, w: 260, h: 160 },
    purpose: 'Live process table',
    detail: 'Snapshot of all processes and their states.' },
  { id: 'fileSystem', label: 'File System', short: 'FS', group: 'kernel', color: '#fcd34d',
    rect: { x: 1820, y: 720, w: 240, h: 160 },
    purpose: 'Virtual file system',
    detail: 'Inodes, directories, and file allocation on the disk.' },
  { id: 'drivers', label: 'Device Drivers', short: 'DRV', group: 'kernel', color: '#a5b4fc',
    rect: { x: 60, y: 940, w: 2000, h: 90 },
    purpose: 'Device drivers',
    detail: 'Kernel modules translating generic I/O requests into device commands.' },
];

export const COMPONENT_MAP: Record<ComponentId, ComponentNode> = COMPONENTS.reduce(
  (acc, c) => { acc[c.id] = c; return acc; },
  {} as Record<ComponentId, ComponentNode>,
);

// Vertical routing channels (x coordinates in the gaps between columns)
const VX = {
  cpuRight: 680,       // right edge of CPU container
  cpuGap: 730,         // gap between CPU and caches (x=680..760)
  cacheRight: 980,     // right edge of caches
  cacheGap: 1030,      // gap between caches and RAM (x=980..1060)
  ramRight: 1400,      // right edge of RAM
  ramGap: 1450,        // gap between RAM and bus (x=1400..1480)
  busRight: 1680,      // right edge of bus container
  busGap: 1730,        // gap between bus and PIC/DMA (x=1680..1760)
  ioRight: 1960,       // right edge of PIC/DMA
  ioGap: 2000,         // gap between PIC/DMA and devices (x=1960..2020)
};
// Horizontal routing channels (y coordinates in the gaps between rows)
const HY = {
  topBottom: 640,      // gap between top section and kernel band (y=600..720)
  kernBottom: 900,     // gap between kernel band and drivers (y=880..940)
};

function edge(id: ComponentId, side: 'left' | 'right' | 'top' | 'bottom', atY?: number, atX?: number) {
  const r = COMPONENT_MAP[id].rect;
  switch (side) {
    case 'left': return { x: r.x, y: atY ?? r.y + r.h / 2 };
    case 'right': return { x: r.x + r.w, y: atY ?? r.y + r.h / 2 };
    case 'top': return { x: atX ?? r.x + r.w / 2, y: r.y };
    case 'bottom': return { x: atX ?? r.x + r.w / 2, y: r.y + r.h };
  }
}

// Bus paths with clean orthogonal routing through the gap channels.
// Every segment stays in empty space — no path crosses through a component.
export const BUS_PATHS: BusPath[] = [
  // ===== CPU internal paths (stay inside CPU container) =====
  { id: 'p_pc_ir', from: 'pc', to: 'ir', kind: 'internal',
    points: [edge('pc', 'right'), edge('ir', 'left')] },
  { id: 'p_ir_cu', from: 'ir', to: 'controlUnit', kind: 'internal',
    points: [edge('ir', 'top', undefined, 350), { x: 350, y: 230 }, { x: 220, y: 230 }, edge('controlUnit', 'bottom', undefined, 220)] },
  { id: 'p_cu_alu', from: 'controlUnit', to: 'alu', kind: 'internal',
    points: [edge('controlUnit', 'right'), edge('alu', 'left')] },
  { id: 'p_reg_alu', from: 'registers', to: 'alu', kind: 'internal',
    points: [edge('registers', 'top', 500), { x: 500, y: 210 }, edge('alu', 'bottom', undefined, 500)] },
  { id: 'p_alu_reg', from: 'alu', to: 'registers', kind: 'internal',
    points: [edge('alu', 'bottom', undefined, 440), { x: 440, y: 250 }, edge('registers', 'top', 440)] },

  // ===== CPU → Cache hierarchy & Clock =====
  { id: 'p_clk_cpu', from: 'clock', to: 'cpu', kind: 'clock',
    points: [edge('clock', 'top'), { x: 180, y: 440 }] },
  { id: 'p_cpu_l1', from: 'cpu', to: 'l1', kind: 'internal',
    points: [edge('cpu', 'right', 175), edge('l1', 'left', 175)] },
  { id: 'p_l1_l2', from: 'l1', to: 'l2', kind: 'internal',
    points: [edge('l1', 'bottom', undefined, 870), edge('l2', 'top', undefined, 870)] },
  { id: 'p_l2_l3', from: 'l2', to: 'l3', kind: 'internal',
    points: [edge('l2', 'bottom', undefined, 870), edge('l3', 'top', undefined, 870)] },
  { id: 'p_l3_ram', from: 'l3', to: 'ram', kind: 'internal',
    points: [edge('l3', 'right', 515), edge('ram', 'left', 515)] },

  // ===== RAM → System Bus =====
  { id: 'p_ram_bus', from: 'ram', to: 'systemBus', kind: 'data',
    points: [edge('ram', 'right', 175), edge('systemBus', 'left', 175)] },

  // ===== CPU → Address Bus (dedicated channel tracks: x=700, y=615, x=1432) =====
  { id: 'p_cpu_addr', from: 'cpu', to: 'addressBus', kind: 'address',
    points: [edge('cpu', 'right', 280), { x: 700, y: 280 }, { x: 700, y: 615 }, { x: 1432, y: 615 }, { x: 1432, y: 175 }, edge('addressBus', 'left', 175)] },

  // ===== RAM → Data Bus (dedicated channel track: y=345) =====
  { id: 'p_ram_data', from: 'ram', to: 'dataBus', kind: 'data',
    points: [edge('ram', 'right', 345), edge('dataBus', 'left', 345)] },

  // ===== CPU → Control Bus (dedicated channel tracks: x=715, y=630, x=1456) =====
  { id: 'p_cpu_ctrl', from: 'cpu', to: 'controlBus', kind: 'control',
    points: [edge('cpu', 'right', 515), { x: 715, y: 515 }, { x: 715, y: 630 }, { x: 1456, y: 630 }, { x: 1456, y: 515 }, edge('controlBus', 'left', 515)] },

  // ===== PIC → CPU (dedicated channel tracks: x=1700, y=645, x=730) =====
  { id: 'p_pic_cpu', from: 'pic', to: 'cpu', kind: 'control',
    points: [edge('pic', 'left', 140), { x: 1700, y: 140 }, { x: 1700, y: 645 }, { x: 730, y: 645 }, { x: 730, y: 580 }, edge('cpu', 'right', 580)] },

  // ===== DMA → RAM (dedicated channel tracks: x=1715, y=595, x=1440) =====
  { id: 'p_dma_ram', from: 'dma', to: 'ram', kind: 'data',
    points: [edge('dma', 'left', 345), { x: 1715, y: 345 }, { x: 1715, y: 595 }, { x: 1440, y: 595 }, { x: 1440, y: 400 }, edge('ram', 'right', 400)] },

  // ===== Storage → DMA (dedicated channel tracks: x=2100, y=260, x=1980) =====
  { id: 'p_disk_dma', from: 'storage', to: 'dma', kind: 'disk',
    points: [edge('storage', 'bottom', undefined, 2100), { x: 2100, y: 260 }, { x: 1980, y: 260 }, { x: 1980, y: 310 }, edge('dma', 'right', 310)] },

  // ===== NIC → DMA (dedicated channel track: y=345) =====
  { id: 'p_nic_dma', from: 'nic', to: 'dma', kind: 'packet',
    points: [edge('nic', 'left', 345), edge('dma', 'right', 345)] },

  // ===== Keyboard → PIC (direct vertical line at x=1850) =====
  { id: 'p_kbd_pic', from: 'keyboard', to: 'pic', kind: 'interrupt',
    points: [edge('keyboard', 'top', undefined, 1850), edge('pic', 'bottom', undefined, 1850)] },

  // ===== Mouse → PIC (dedicated channel tracks: x=1730, y=220) =====
  { id: 'p_mse_pic', from: 'mouse', to: 'pic', kind: 'interrupt',
    points: [edge('mouse', 'left', 570), { x: 1730, y: 570 }, { x: 1730, y: 220 }, edge('pic', 'left', 220)] },

  // ===== Timer → PIC (dedicated channel tracks: x=745, y=660, x=1745) =====
  { id: 'p_tmr_pic', from: 'timer', to: 'pic', kind: 'interrupt',
    points: [edge('timer', 'right', 510), { x: 745, y: 510 }, { x: 745, y: 660 }, { x: 1745, y: 660 }, { x: 1745, y: 240 }, edge('pic', 'bottom', undefined, 1745)] },

  // ===== Kernel → Scheduler =====
  { id: 'p_kern_sched', from: 'kernel', to: 'scheduler', kind: 'control',
    points: [edge('kernel', 'right', 800), edge('scheduler', 'left', 800)] },

  // ===== Scheduler → ReadyQueue =====
  { id: 'p_sched_ready', from: 'scheduler', to: 'readyQueue', kind: 'schedule',
    points: [edge('scheduler', 'right', 800), edge('readyQueue', 'left', 800)] },

  // ===== ReadyQueue → Processes (dedicated track above queues: y=705) =====
  { id: 'p_ready_proc', from: 'readyQueue', to: 'processes', kind: 'schedule',
    points: [edge('readyQueue', 'top', undefined, 900), { x: 900, y: 705 }, { x: 1610, y: 705 }, edge('processes', 'top', undefined, 1610)] },

  // ===== Processes → WaitingQueue (dedicated track below queues: y=900) =====
  { id: 'p_proc_wait', from: 'processes', to: 'waitingQueue', kind: 'schedule',
    points: [edge('processes', 'bottom', undefined, 1610), { x: 1610, y: 900 }, { x: 1260, y: 900 }, edge('waitingQueue', 'bottom', undefined, 1260)] },

  // ===== WaitingQueue → ReadyQueue (dedicated track above queues: y=685) =====
  { id: 'p_wait_ready', from: 'waitingQueue', to: 'readyQueue', kind: 'schedule',
    points: [edge('waitingQueue', 'top', undefined, 1260), { x: 1260, y: 685 }, { x: 900, y: 685 }, edge('readyQueue', 'top', undefined, 900)] },

  // ===== Kernel → CPU (dedicated channel track: x=220, y=690, x=640) =====
  { id: 'p_kern_cpu', from: 'kernel', to: 'cpu', kind: 'control',
    points: [edge('kernel', 'top', undefined, 220), { x: 220, y: 690 }, { x: 640, y: 690 }, edge('cpu', 'bottom', undefined, 640)] },

  // ===== Filesystem → Storage (dedicated channel track: y=670, x=2115) =====
  { id: 'p_fs_disk', from: 'fileSystem', to: 'storage', kind: 'disk',
    points: [edge('fileSystem', 'top', undefined, 1940), { x: 1940, y: 670 }, { x: 2115, y: 670 }, edge('storage', 'bottom', undefined, 2115)] },

  // ===== Drivers → NIC (dedicated channel track: y=915, x=2090) =====
  { id: 'p_drv_io', from: 'drivers', to: 'nic', kind: 'control',
    points: [edge('drivers', 'top', undefined, 1780), { x: 1780, y: 915 }, { x: 2090, y: 915 }, edge('nic', 'bottom', undefined, 2090)] },

  // ===== RAM → GPU (dedicated channel tracks: x=1468, y=675, x=1990) =====
  { id: 'p_ram_gpu', from: 'ram', to: 'gpu', kind: 'data',
    points: [edge('ram', 'right', 500), { x: 1468, y: 500 }, { x: 1468, y: 675 }, { x: 1990, y: 675 }, { x: 1990, y: 515 }, edge('gpu', 'left', 515)] },

  // ===== GPU → DMA (dedicated channel tracks: x=2005, y=370) =====
  { id: 'p_gpu_dma', from: 'gpu', to: 'dma', kind: 'data',
    points: [edge('gpu', 'left', 490), { x: 2005, y: 490 }, { x: 2005, y: 370 }, edge('dma', 'right', 370)] },
];

export const PATH_MAP: Record<string, BusPath> = BUS_PATHS.reduce(
  (acc, p) => { acc[p.id] = p; return acc; },
  {} as Record<string, BusPath>,
);

export function pathLength(path: BusPath): number {
  let len = 0;
  for (let i = 1; i < path.points.length; i++) {
    const dx = path.points[i].x - path.points[i - 1].x;
    const dy = path.points[i].y - path.points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export function pointAt(path: BusPath, t: number): { x: number; y: number } {
  const total = pathLength(path);
  if (total === 0) return path.points[0];
  let target = t * total;
  for (let i = 1; i < path.points.length; i++) {
    const dx = path.points[i].x - path.points[i - 1].x;
    const dy = path.points[i].y - path.points[i - 1].y;
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (target <= seg) {
      const r = seg === 0 ? 0 : target / seg;
      return {
        x: path.points[i - 1].x + dx * r,
        y: path.points[i - 1].y + dy * r,
      };
    }
    target -= seg;
  }
  return path.points[path.points.length - 1];
}

// Color for each path kind (used for the trace lines)
export const KIND_TRACE_COLORS: Record<string, string> = {
  address: '#a78bfa',
  data: '#c084fc',
  control: '#e879f9',
  internal: '#38bdf8',
  disk: '#facc15',
  packet: '#4ade80',
  interrupt: '#fb7185',
  clock: '#fbbf24',
  schedule: '#2dd4bf',
  gpuRender: '#818cf8',
  mouseEvent: '#fb923c',
};
