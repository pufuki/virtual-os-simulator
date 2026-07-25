import type {
  CacheLevel, MemoryCell, Process, SimState, SignalKind,
} from './types';

const INSTRUCTIONS = [
  'LOAD R1, [0x1000]', 'LOAD R2, [0x1004]', 'ADD R3, R1, R2',
  'STORE R3, [0x1008]', 'SUB R4, R1, R2', 'MOV R5, R3',
  'CMP R1, R2', 'JMP 0x0040', 'MUL R6, R1, R2', 'AND R7, R3, R4',
  'OR R0, R5, R6', 'SHL R1, 2', 'LOAD R0, [0x2000]', 'STORE R0, [0x2004]',
];

const PROC_NAMES = ['init', 'shell', 'editor', 'compiler', 'browser', 'daemon', 'logger', 'server'];
const PROC_COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#22d3ee', '#4ade80'];

let sigCounter = 0;
function nextId() { return `s${sigCounter++}`; }

function makeCache(size: number): CacheLevel['lines'] {
  return Array.from({ length: size }, () => ({
    valid: false, tag: '', data: '0x0000', lastUsed: 0,
  }));
}

function makeMemory(rows: number): MemoryCell[] {
  return Array.from({ length: rows }, (_, i) => ({
    addr: '0x' + (i * 4).toString(16).padStart(4, '0').toUpperCase(),
    value: '0x' + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase(),
    lastAccess: 0,
  }));
}

function makeProcesses(): Process[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: PROC_NAMES[i % PROC_NAMES.length],
    state: i === 0 ? 'running' : 'ready',
    color: PROC_COLORS[i % PROC_COLORS.length],
    pc: Math.floor(Math.random() * 0x1000),
    priority: Math.floor(Math.random() * 3),
    burst: 5 + Math.floor(Math.random() * 15),
    remaining: 5 + Math.floor(Math.random() * 15),
    waitingOn: 'none' as const,
  }));
}

export function createInitialState(): SimState {
  return {
    tick: 0,
    cycle: 0,
    running: true,
    speed: 1,
    pc: '0x00400018',
    ir: 'LOAD R1, [0x1000]',
    sp: '0x7FFFE000',
    registers: [
      { name: 'R0', value: '0x0000' }, { name: 'R1', value: '0x0042' },
      { name: 'R2', value: '0x0080' }, { name: 'R3', value: '0x0000' },
      { name: 'R4', value: '0xFFFF' }, { name: 'R5', value: '0x0010' },
      { name: 'R6', value: '0x0007' }, { name: 'R7', value: '0x0000' },
    ],
    pipeline: [
      { name: 'Fetch', instruction: 'LOAD R1, [0x1000]', stalled: false },
      { name: 'Decode', instruction: null, stalled: false },
      { name: 'Execute', instruction: null, stalled: false },
      { name: 'Memory', instruction: null, stalled: false },
      { name: 'WriteBack', instruction: null, stalled: false },
    ],
    caches: {
      l1: { id: 'l1', name: 'L1', lines: makeCache(8), size: 8, hits: 0, misses: 0 },
      l2: { id: 'l2', name: 'L2', lines: makeCache(16), size: 16, hits: 0, misses: 0 },
      l3: { id: 'l3', name: 'L3', lines: makeCache(32), size: 32, hits: 0, misses: 0 },
    },
    memory: makeMemory(32),
    processes: makeProcesses(),
    currentPid: 1,
    schedulingAlgo: 'roundRobin',
    quantum: 4,
    quantumLeft: 4,
    interrupts: [],
    dmaActive: false,
    dmaProgress: 0,
    syscallActive: false,
    syscallName: null,
    log: [],
    events: [],
  };
}

// Each entry describes a signal that should be emitted, on which path, with what kind.
export interface Emission {
  pathId: string;
  kind: SignalKind;
  color: string;
  speed?: number;
  payload?: string;
}

let logCounter = 0;
let eventCounter = 0;

function addLog(state: SimState, text: string, kind: SignalKind) {
  state.log.unshift({ id: logCounter++, text, kind, t: state.tick });
  if (state.log.length > 60) state.log.pop();
}
function addEvent(state: SimState, text: string, component: SimState['events'][number]['component']) {
  state.events.unshift({ id: eventCounter++, text, component, t: state.tick });
  if (state.events.length > 8) state.events.pop();
}

// Advance the simulation by one logical cycle. Returns the signals to spawn.
export function stepSim(state: SimState): Emission[] {
  const emissions: Emission[] = [];
  state.tick++;
  if (!state.running) return emissions;

  // Every cycle advances the pipeline + clock.
  state.cycle++;

  // ---- Clock pulse ----
  emissions.push({ pathId: 'p_clk_cpu', kind: 'clock', color: '#fbbf24', speed: 2.5 });

  // ---- Pipeline advance ----
  // Shift instructions forward; inject new fetch.
  for (let i = state.pipeline.length - 1; i > 0; i--) {
    const prev = state.pipeline[i - 1];
    if (!state.pipeline[i].instruction && prev.instruction) {
      state.pipeline[i].instruction = prev.instruction;
      state.pipeline[i - 1].instruction = null;
    }
  }
  const newInstr = INSTRUCTIONS[state.cycle % INSTRUCTIONS.length];
  if (!state.pipeline[0].instruction) {
    state.pipeline[0].instruction = newInstr;
    state.ir = newInstr;
  }

  // Emit signals for active pipeline stages.
  if (state.pipeline[0].instruction) emissions.push({ pathId: 'p_pc_ir', kind: 'fetch', color: '#60a5fa', speed: 1.8, payload: newInstr });
  if (state.pipeline[1].instruction) emissions.push({ pathId: 'p_ir_cu', kind: 'decode', color: '#22d3ee', speed: 1.8 });
  if (state.pipeline[2].instruction) {
    emissions.push({ pathId: 'p_reg_alu', kind: 'execute', color: '#34d399', speed: 1.8 });
    emissions.push({ pathId: 'p_alu_reg', kind: 'execute', color: '#34d399', speed: 1.8 });
  }
  if (state.pipeline[3].instruction) {
    // Memory stage -> cache access
    emissions.push({ pathId: 'p_cpu_l1', kind: 'memRead', color: '#34d399', speed: 1.6 });
    handleCacheAccess(state, emissions);
  }
  if (state.pipeline[4].instruction) {
    // WriteBack updates a register
    const regIdx = state.cycle % state.registers.length;
    state.registers[regIdx].value = '0x' + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase();
  }

  // Advance PC
  const pcInt = parseInt(state.pc, 16) || 0x400018;
  state.pc = '0x' + (pcInt + 4).toString(16).padStart(8, '0').toUpperCase();

  // ---- Scheduler ----
  state.quantumLeft--;
  if (state.quantumLeft <= 0) {
    contextSwitch(state, emissions);
    state.quantumLeft = state.quantum;
  }

  // Progress running process
  const running = state.processes.find(p => p.state === 'running');
  if (running) {
    running.remaining--;
    running.pc += 4;
    if (running.remaining <= 0) {
      running.state = 'terminated';
      addLog(state, `Process ${running.name} (PID ${running.id}) terminated`, 'schedule');
      addEvent(state, `${running.name} finished`, 'processes');
      // promote a ready process
      const next = state.processes.find(p => p.state === 'ready');
      if (next) { next.state = 'running'; state.currentPid = next.id; }
    }
  }

  // Occasionally wake waiting processes
  if (state.tick % 7 === 0) {
    const waiting = state.processes.find(p => p.state === 'waiting');
    if (waiting) {
      waiting.state = 'ready';
      waiting.waitingOn = 'none';
      addEvent(state, `${waiting.name} woke up`, 'waitingQueue');
      emissions.push({ pathId: 'p_wait_ready', kind: 'schedule', color: '#86efac', speed: 1.4 });
    }
  }
  // Occasionally block running process
  if (state.tick % 11 === 0 && running && running.remaining > 2) {
    const waits = ['disk', 'network', 'keyboard'] as const;
    running.state = 'waiting';
    running.waitingOn = waits[state.tick % 3];
    addLog(state, `${running.name} blocked on ${running.waitingOn}`, 'schedule');
    addEvent(state, `${running.name} → waiting`, 'processes');
    emissions.push({ pathId: 'p_proc_wait', kind: 'schedule', color: '#fca5a5', speed: 1.4 });
    const next = state.processes.find(p => p.state === 'ready');
    if (next) { next.state = 'running'; state.currentPid = next.id; state.quantumLeft = state.quantum; }
  }

  // Replenish terminated processes
  if (state.processes.filter(p => p.state !== 'terminated').length < 3) {
    const idx = state.processes.length;
    state.processes.push({
      id: idx + 1, name: PROC_NAMES[idx % PROC_NAMES.length], state: 'ready',
      color: PROC_COLORS[idx % PROC_COLORS.length], pc: Math.floor(Math.random() * 0x1000),
      priority: Math.floor(Math.random() * 3), burst: 5 + Math.floor(Math.random() * 15),
      remaining: 5 + Math.floor(Math.random() * 15), waitingOn: 'none',
    });
    emissions.push({ pathId: 'p_sched_ready', kind: 'schedule', color: '#86efac', speed: 1.4 });
  }

  // Prune terminated processes to prevent unbounded growth
  if (state.processes.length > 20) {
    const terminated = state.processes.filter(p => p.state === 'terminated');
    if (terminated.length > 5) {
      const toRemove = new Set(terminated.slice(0, terminated.length - 5).map(p => p.id));
      state.processes = state.processes.filter(p => !toRemove.has(p.id));
    }
  }

  // ---- Interrupts (timer) ----
  if (state.tick % 5 === 0) {
    state.interrupts.push({ id: nextId(), source: 'Timer', priority: 1, active: true });
    emissions.push({ pathId: 'p_tmr_pic', kind: 'interrupt', color: '#fb7185', speed: 1.5 });
    addLog(state, 'Timer interrupt fired', 'interrupt');
  }

  // ---- DMA transfer ----
  if (state.tick % 9 === 0 && !state.dmaActive) {
    state.dmaActive = true;
    state.dmaProgress = 0;
    addLog(state, 'DMA transfer started (disk → memory)', 'dma');
    addEvent(state, 'DMA started', 'dma');
    emissions.push({ pathId: 'p_disk_dma', kind: 'dma', color: '#f472b6', speed: 1.2 });
  }
  if (state.dmaActive) {
    state.dmaProgress += 0.15;
    emissions.push({ pathId: 'p_dma_ram', kind: 'dma', color: '#f472b6', speed: 1.2, payload: 'BLK' });
    if (state.dmaProgress >= 1) {
      state.dmaActive = false;
      addLog(state, 'DMA transfer complete', 'dma');
    }
  }

  // ---- Network packets ----
  if (state.tick % 4 === 0) {
    emissions.push({ pathId: 'p_nic_dma', kind: 'packet', color: '#4ade80', speed: 1.6, payload: 'PKT' });
    emissions.push({ pathId: 'p_dma_ram', kind: 'packet', color: '#4ade80', speed: 1.6, payload: 'PKT' });
    addLog(state, 'Network packet received', 'packet');
  }

  // ---- Filesystem access ----
  if (state.tick % 6 === 0) {
    emissions.push({ pathId: 'p_fs_disk', kind: 'disk', color: '#facc15', speed: 1.3 });
    // touch a random memory cell to simulate file read
    const cell = state.memory[state.tick % state.memory.length];
    cell.lastAccess = state.tick;
    addEvent(state, 'File read', 'fileSystem');
  }

  // ---- System call ----
  if (state.tick % 13 === 0 && !state.syscallActive) {
    state.syscallActive = true;
    state.syscallName = ['read()', 'write()', 'fork()', 'exec()', 'open()'][state.tick % 5];
    emissions.push({ pathId: 'p_kern_cpu', kind: 'syscall', color: '#22d3ee', speed: 1.5, payload: state.syscallName });
    addLog(state, `System call: ${state.syscallName}`, 'syscall');
    addEvent(state, `syscall ${state.syscallName}`, 'kernel');
  }
  if (state.syscallActive && state.tick % 3 === 0) {
    state.syscallActive = false;
    state.syscallName = null;
  }

  // Process active interrupts -> signal CPU
  state.interrupts = state.interrupts.filter(i => i.active);
  if (state.interrupts.length > 0) {
    emissions.push({ pathId: 'p_pic_cpu', kind: 'interrupt', color: '#fb7185', speed: 1.7 });
    // deactivate after signaling
    state.interrupts.forEach(i => { if (Math.random() < 0.5) i.active = false; });
  }

  // ---- GPU frame render (memory-mapped I/O) ----
  if (state.tick % 8 === 0) {
    emissions.push({ pathId: 'p_ram_gpu', kind: 'gpuRender', color: '#818cf8', speed: 1.5, payload: 'FRAME' });
    addLog(state, 'GPU frame render (framebuffer update)', 'gpuRender');
    addEvent(state, 'GPU render', 'gpu');
  }

  // ---- Mouse movement (periodic mouse IRQ) ----
  if (state.tick % 10 === 0) {
    state.interrupts.push({ id: nextId(), source: 'Mouse', priority: 4, active: true });
    emissions.push({ pathId: 'p_mse_pic', kind: 'mouseEvent', color: '#fb923c', speed: 1.4 });
    addLog(state, 'Mouse movement interrupt', 'mouseEvent');
    addEvent(state, 'Mouse move', 'mouse');
  }

  // ---- Driver I/O ----
  if (state.tick % 12 === 0) {
    emissions.push({ pathId: 'p_drv_io', kind: 'control', color: '#a5b4fc', speed: 1.3 });
    addLog(state, 'Driver I/O request to NIC', 'packet');
    addEvent(state, 'Driver I/O', 'drivers');
  }

  return emissions;
}

function handleCacheAccess(state: SimState, emissions: Emission[]) {
  const tag = '0x' + (state.cycle * 7 % 0xff).toString(16);
  // L1
  let hit = state.caches.l1.lines.some(l => l.valid && l.tag === tag);
  if (hit) {
    state.caches.l1.hits++;
    return;
  }
  state.caches.l1.misses++;
  emissions.push({ pathId: 'p_l1_l2', kind: 'cacheAccess', color: '#10b981', speed: 1.4 });
  // L2
  hit = state.caches.l2.lines.some(l => l.valid && l.tag === tag);
  if (hit) { state.caches.l2.hits++; return; }
  state.caches.l2.misses++;
  emissions.push({ pathId: 'p_l2_l3', kind: 'cacheAccess', color: '#059669', speed: 1.4 });
  // L3
  hit = state.caches.l3.lines.some(l => l.valid && l.tag === tag);
  if (hit) { state.caches.l3.hits++; return; }
  state.caches.l3.misses++;
  emissions.push({ pathId: 'p_l3_ram', kind: 'cacheAccess', color: '#2dd4bf', speed: 1.4 });
  // Miss all the way -> load from RAM into L3->L2->L1 (LRU replace)
  insertCache(state.caches.l3, tag, state.tick);
  insertCache(state.caches.l2, tag, state.tick);
  insertCache(state.caches.l1, tag, state.tick);
  // touch memory
  const cell = state.memory[state.cycle % state.memory.length];
  cell.lastAccess = state.tick;
  addLog(state, `Cache miss (tag ${tag}) → RAM fetch`, 'cacheAccess');
}

function insertCache(cache: CacheLevel, tag: string, tick: number) {
  let idx = cache.lines.findIndex(l => !l.valid);
  if (idx === -1) idx = cache.lines.reduce((oldest, l, i, arr) => l.lastUsed < arr[oldest].lastUsed ? i : oldest, 0);
  cache.lines[idx] = { valid: true, tag, data: '0x' + Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0'), lastUsed: tick };
}

function contextSwitch(state: SimState, emissions: Emission[]) {
  const running = state.processes.find(p => p.state === 'running');
  if (running) {
    running.state = 'ready';
    emissions.push({ pathId: 'p_ready_proc', kind: 'schedule', color: '#86efac', speed: 1.5, payload: running.name });
  }
  // pick next by algorithm
  const ready = state.processes.filter(p => p.state === 'ready');
  if (ready.length === 0) return;
  let next: Process;
  switch (state.schedulingAlgo) {
    case 'fcfs': next = ready[0]; break;
    case 'priority': next = ready.reduce((a, b) => a.priority < b.priority ? a : b); break;
    case 'sjf': next = ready.reduce((a, b) => a.remaining < b.remaining ? a : b); break;
    case 'roundRobin':
    default: next = ready[0]; break;
  }
  next.state = 'running';
  state.currentPid = next.id;
  addLog(state, `Context switch → ${next.name} (PID ${next.id})`, 'schedule');
  addEvent(state, `Switch → ${next.name}`, 'scheduler');
  emissions.push({ pathId: 'p_sched_ready', kind: 'schedule', color: '#2dd4bf', speed: 1.5 });
  emissions.push({ pathId: 'p_ready_proc', kind: 'schedule', color: '#2dd4bf', speed: 1.5 });
}

// ---- User-triggered actions ----
export function triggerKeyboardInterrupt(state: SimState): Emission[] {
  state.interrupts.push({ id: nextId(), source: 'Keyboard', priority: 2, active: true });
  addLog(state, 'Keyboard interrupt triggered', 'interrupt');
  addEvent(state, 'Keyboard IRQ', 'keyboard');
  return [
    { pathId: 'p_kbd_pic', kind: 'interrupt', color: '#f87171', speed: 1.6 },
    { pathId: 'p_pic_cpu', kind: 'interrupt', color: '#fb7185', speed: 1.7 },
  ];
}
export function triggerDiskInterrupt(state: SimState): Emission[] {
  state.interrupts.push({ id: nextId(), source: 'Disk', priority: 3, active: true });
  addLog(state, 'Disk interrupt triggered', 'interrupt');
  addEvent(state, 'Disk IRQ', 'storage');
  return [{ pathId: 'p_fs_disk', kind: 'disk', color: '#facc15', speed: 1.4 }];
}
export function triggerPageFault(state: SimState): Emission[] {
  addLog(state, 'Page fault generated', 'memRead');
  addEvent(state, 'Page fault', 'ram');
  const cell = state.memory[Math.floor(Math.random() * state.memory.length)];
  cell.lastAccess = state.tick;
  return [
    { pathId: 'p_l3_ram', kind: 'memRead', color: '#2dd4bf', speed: 1.3 },
    { pathId: 'p_fs_disk', kind: 'disk', color: '#facc15', speed: 1.2 },
  ];
}
export function triggerCacheMiss(state: SimState): Emission[] {
  addLog(state, 'Cache miss injected', 'cacheAccess');
  addEvent(state, 'Cache miss', 'l1');
  return [
    { pathId: 'p_l1_l2', kind: 'cacheAccess', color: '#10b981', speed: 1.4 },
    { pathId: 'p_l2_l3', kind: 'cacheAccess', color: '#059669', speed: 1.4 },
    { pathId: 'p_l3_ram', kind: 'cacheAccess', color: '#2dd4bf', speed: 1.4 },
  ];
}
export function triggerDMA(state: SimState): Emission[] {
  state.dmaActive = true;
  state.dmaProgress = 0;
  addLog(state, 'DMA transfer started (manual)', 'dma');
  addEvent(state, 'DMA started', 'dma');
  return [{ pathId: 'p_disk_dma', kind: 'dma', color: '#f472b6', speed: 1.2 }];
}
export function spawnProcess(state: SimState): Emission[] {
  const idx = state.processes.length;
  state.processes.push({
    id: idx + 1, name: PROC_NAMES[idx % PROC_NAMES.length], state: 'ready',
    color: PROC_COLORS[idx % PROC_COLORS.length], pc: Math.floor(Math.random() * 0x1000),
    priority: Math.floor(Math.random() * 3), burst: 5 + Math.floor(Math.random() * 15),
    remaining: 5 + Math.floor(Math.random() * 15), waitingOn: 'none',
  });
  addLog(state, `Process spawned: ${PROC_NAMES[idx % PROC_NAMES.length]}`, 'schedule');
  addEvent(state, 'Process spawned', 'processes');
  return [{ pathId: 'p_sched_ready', kind: 'schedule', color: '#86efac', speed: 1.4 }];
}
export function killProcess(state: SimState): Emission[] {
  const running = state.processes.find(p => p.state === 'running');
  if (running) {
    running.state = 'terminated';
    addLog(state, `Process killed: ${running.name}`, 'schedule');
    addEvent(state, `${running.name} killed`, 'processes');
  }
  return [];
}
export function generatePacket(state: SimState): Emission[] {
  addLog(state, 'Network packet generated', 'packet');
  addEvent(state, 'Packet sent', 'nic');
  return [
    { pathId: 'p_nic_dma', kind: 'packet', color: '#4ade80', speed: 1.6, payload: 'PKT' },
    { pathId: 'p_dma_ram', kind: 'packet', color: '#4ade80', speed: 1.6, payload: 'PKT' },
  ];
}

export function triggerMouseClick(state: SimState): Emission[] {
  state.interrupts.push({ id: nextId(), source: 'Mouse', priority: 4, active: true });
  addLog(state, 'Mouse click interrupt triggered', 'mouseEvent');
  addEvent(state, 'Mouse click IRQ', 'mouse');
  return [
    { pathId: 'p_mse_pic', kind: 'mouseEvent', color: '#fb923c', speed: 1.6 },
    { pathId: 'p_pic_cpu', kind: 'interrupt', color: '#fb7185', speed: 1.7 },
  ];
}

export function triggerSyscall(state: SimState): Emission[] {
  const calls = ['read()', 'write()', 'fork()', 'exec()', 'open()', 'close()', 'mmap()', 'ioctl()'];
  const call = calls[state.tick % calls.length];
  state.syscallActive = true;
  state.syscallName = call;
  addLog(state, `Manual system call: ${call}`, 'syscall');
  addEvent(state, `syscall ${call}`, 'kernel');
  return [
    { pathId: 'p_kern_cpu', kind: 'syscall', color: '#22d3ee', speed: 1.5, payload: call },
    { pathId: 'p_kern_sched', kind: 'control', color: '#22d3ee', speed: 1.3 },
  ];
}

export function triggerContextSwitch(state: SimState): Emission[] {
  const emissions: Emission[] = [];
  contextSwitch(state, emissions);
  addLog(state, 'Manual context switch triggered', 'schedule');
  state.quantumLeft = state.quantum;
  return emissions;
}

export function triggerGpuRender(state: SimState): Emission[] {
  addLog(state, 'GPU render triggered (manual)', 'gpuRender');
  addEvent(state, 'GPU render', 'gpu');
  return [
    { pathId: 'p_ram_gpu', kind: 'gpuRender', color: '#818cf8', speed: 1.5, payload: 'FRAME' },
    { pathId: 'p_gpu_dma', kind: 'gpuRender', color: '#818cf8', speed: 1.3, payload: 'DMA' },
  ];
}

export function triggerTimerInterrupt(state: SimState): Emission[] {
  state.interrupts.push({ id: nextId(), source: 'Timer', priority: 1, active: true });
  addLog(state, 'Timer interrupt triggered (manual)', 'interrupt');
  addEvent(state, 'Timer IRQ', 'timer');
  return [
    { pathId: 'p_tmr_pic', kind: 'interrupt', color: '#fb7185', speed: 1.5 },
    { pathId: 'p_pic_cpu', kind: 'interrupt', color: '#fb7185', speed: 1.7 },
  ];
}
