// Core type definitions for the Virtual OS Architecture Simulator.
// Everything in the simulation is driven by these shared types so new
// modules can be added without touching the renderer.

export type ComponentId =
  | 'cpu'
  | 'alu'
  | 'controlUnit'
  | 'registers'
  | 'pc'
  | 'ir'
  | 'sp'
  | 'l1'
  | 'l2'
  | 'l3'
  | 'ram'
  | 'pic'
  | 'dma'
  | 'storage'
  | 'nic'
  | 'keyboard'
  | 'mouse'
  | 'gpu'
  | 'clock'
  | 'timer'
  | 'systemBus'
  | 'addressBus'
  | 'dataBus'
  | 'controlBus'
  | 'kernel'
  | 'scheduler'
  | 'readyQueue'
  | 'waitingQueue'
  | 'processes'
  | 'fileSystem'
  | 'drivers';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ComponentNode {
  id: ComponentId;
  label: string;
  short: string;
  rect: Rect;
  group: 'cpu' | 'memory' | 'bus' | 'io' | 'kernel';
  color: string;
  purpose: string;
  detail: string;
}

export interface BusPath {
  id: string;
  from: ComponentId;
  to: ComponentId;
  points: { x: number; y: number }[];
  kind: 'address' | 'data' | 'control' | 'internal' | 'disk' | 'packet' | 'interrupt' | 'clock' | 'schedule';
}

export type SignalKind =
  | 'fetch'
  | 'decode'
  | 'execute'
  | 'memRead'
  | 'memWrite'
  | 'cacheAccess'
  | 'interrupt'
  | 'dma'
  | 'syscall'
  | 'packet'
  | 'disk'
  | 'clock'
  | 'schedule'
  | 'gpuRender'
  | 'mouseEvent'
  | 'control';

export interface Signal {
  id: string;
  pathId: string;
  kind: SignalKind;
  progress: number; // 0..1 along the path
  speed: number; // units per second
  payload?: string;
  color: string;
}

export interface Register {
  name: string;
  value: string;
}

export interface PipelineStage {
  name: 'Fetch' | 'Decode' | 'Execute' | 'Memory' | 'WriteBack';
  instruction: string | null;
  stalled: boolean;
}

export interface CacheLine {
  valid: boolean;
  tag: string;
  data: string;
  lastUsed: number;
}

export interface CacheLevel {
  id: ComponentId;
  name: string;
  lines: CacheLine[];
  size: number;
  hits: number;
  misses: number;
}

export interface MemoryCell {
  addr: string;
  value: string;
  lastAccess: number;
}

export interface Process {
  id: number;
  name: string;
  state: 'running' | 'ready' | 'waiting' | 'terminated';
  color: string;
  pc: number;
  priority: number;
  burst: number;
  remaining: number;
  waitingOn?: 'disk' | 'network' | 'keyboard' | 'none';
}

export interface SimState {
  tick: number;
  cycle: number;
  running: boolean;
  speed: number;
  pc: string;
  ir: string;
  sp: string;
  registers: Register[];
  pipeline: PipelineStage[];
  caches: Record<'l1' | 'l2' | 'l3', CacheLevel>;
  memory: MemoryCell[];
  processes: Process[];
  currentPid: number;
  schedulingAlgo: 'roundRobin' | 'fcfs' | 'priority' | 'sjf';
  quantum: number;
  quantumLeft: number;
  interrupts: { id: string; source: string; priority: number; active: boolean }[];
  dmaActive: boolean;
  dmaProgress: number;
  syscallActive: boolean;
  syscallName: string | null;
  log: { id: number; text: string; kind: SignalKind; t: number }[];
  events: { id: number; text: string; component: ComponentId; t: number }[];
}
