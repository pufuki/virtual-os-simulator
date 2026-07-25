import type { ComponentId, SimState } from '@/sim/types';

interface Props {
  id: ComponentId;
  sim: SimState;
  onBack: () => void;
}

// Detail panel that appears when a component is focused, showing its internals.
export function DetailView({ id, sim, onBack }: Props) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[min(92vw,42rem)] pointer-events-auto">
      <div className="rounded-xl bg-slate-950/90 backdrop-blur border border-slate-700/60 shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-mono tracking-wider text-sky-300">{titleFor(id)}</h3>
          <button onClick={onBack}
            className="px-2 py-1 rounded-md text-[11px] font-mono bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition">
            ← BACK TO MOTHERBOARD
          </button>
        </div>
        <Body id={id} sim={sim} />
      </div>
    </div>
  );
}

function titleFor(id: ComponentId): string {
  const map: Record<string, string> = {
    cpu: 'CPU — FETCH / DECODE / EXECUTE',
    alu: 'ALU — ARITHMETIC LOGIC UNIT',
    controlUnit: 'CONTROL UNIT',
    registers: 'REGISTERS',
    pc: 'PROGRAM COUNTER',
    ir: 'INSTRUCTION REGISTER',
    sp: 'STACK POINTER',
    l1: 'L1 CACHE',
    l2: 'L2 CACHE',
    l3: 'L3 CACHE',
    ram: 'MAIN MEMORY (RAM)',
    pic: 'INTERRUPT CONTROLLER',
    dma: 'DMA CONTROLLER',
    storage: 'STORAGE (DISK)',
    nic: 'NETWORK CARD',
    keyboard: 'KEYBOARD',
    mouse: 'MOUSE',
    gpu: 'GPU',
    clock: 'CLOCK',
    timer: 'TIMER',
    systemBus: 'SYSTEM BUS',
    addressBus: 'ADDRESS BUS',
    dataBus: 'DATA BUS',
    controlBus: 'CONTROL BUS',
    kernel: 'KERNEL',
    scheduler: 'SCHEDULER',
    readyQueue: 'READY QUEUE',
    waitingQueue: 'WAITING QUEUE',
    processes: 'RUNNING PROCESSES',
    fileSystem: 'FILE SYSTEM',
    drivers: 'DEVICE DRIVERS',
  };
  return map[id] || id.toUpperCase();
}

function Body({ id, sim }: { id: ComponentId; sim: SimState }) {
  switch (id) {
    case 'cpu': return <CpuView sim={sim} />;
    case 'registers': return <RegistersView sim={sim} />;
    case 'ram': return <RamView sim={sim} />;
    case 'l1':
    case 'l2':
    case 'l3': return <CacheView sim={sim} id={id} />;
    case 'scheduler':
    case 'readyQueue':
    case 'waitingQueue':
    case 'processes': return <SchedulerView sim={sim} />;
    case 'pic': return <PicView sim={sim} />;
    case 'dma': return <DmaView sim={sim} />;
    case 'fileSystem': return <FsView sim={sim} />;
    default: return <GenericView id={id} sim={sim} />;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-[11px] font-mono">
      <span className="text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-slate-200">{children}</span>
    </div>
  );
}

function CpuView({ sim }: { sim: SimState }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5">
        {sim.pipeline.map((s, i) => (
          <div key={s.name} className={`rounded-lg border p-2 text-center ${s.instruction ? 'border-sky-500/60 bg-sky-500/10' : 'border-slate-700/50 bg-slate-800/30'}`}>
            <div className="text-[10px] font-mono text-slate-400 mb-1">{i + 1}. {s.name}</div>
            <div className={`text-[10px] font-mono ${s.instruction ? 'text-sky-200' : 'text-slate-600'}`}>
              {s.instruction || '—'}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div className="rounded-lg bg-slate-800/40 p-2">
          <div className="text-slate-500 text-[10px]">PC</div>
          <div className="text-indigo-300">{sim.pc}</div>
        </div>
        <div className="rounded-lg bg-slate-800/40 p-2">
          <div className="text-slate-500 text-[10px]">IR</div>
          <div className="text-cyan-300 truncate">{sim.ir}</div>
        </div>
        <div className="rounded-lg bg-slate-800/40 p-2">
          <div className="text-slate-500 text-[10px]">SP</div>
          <div className="text-indigo-300">{sim.sp}</div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        The CPU repeatedly fetches the instruction at the Program Counter, decodes it in the
        Control Unit, executes via the ALU, accesses memory, and writes the result back. The
        five-stage pipeline above lets these phases overlap for different instructions.
      </p>
    </div>
  );
}

function RegistersView({ sim }: { sim: SimState }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {sim.registers.map(r => (
        <div key={r.name} className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-2 text-center">
          <div className="text-[10px] font-mono text-slate-500">{r.name}</div>
          <div className="text-[11px] font-mono text-sky-300">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function RamView({ sim }: { sim: SimState }) {
  const now = sim.tick;
  return (
    <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto pr-1">
      {sim.memory.map((c, i) => {
        const fresh = now - c.lastAccess < 4 && c.lastAccess > 0;
        return (
          <div key={i} className={`rounded p-1 text-center font-mono text-[9px] border ${fresh ? 'border-teal-400/70 bg-teal-400/15' : 'border-slate-700/40 bg-slate-800/30'}`}>
            <div className="text-slate-500">{c.addr}</div>
            <div className={fresh ? 'text-teal-200' : 'text-slate-400'}>{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function CacheView({ sim, id }: { sim: SimState; id: 'l1' | 'l2' | 'l3' }) {
  const cache = sim.caches[id];
  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-[11px] font-mono">
        <span className="text-emerald-300">Hits: {cache.hits}</span>
        <span className="text-rose-300">Misses: {cache.misses}</span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {cache.lines.map((l, i) => (
          <div key={i} className={`rounded p-1 text-center font-mono text-[9px] border ${l.valid ? 'border-emerald-400/50 bg-emerald-400/10' : 'border-slate-700/40 bg-slate-800/30'}`}>
            <div className={l.valid ? 'text-emerald-300' : 'text-slate-600'}>{l.valid ? l.tag : '—'}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        On a memory access the CPU checks L1 first. A miss propagates to L2, then L3, then RAM,
        and the fetched line is installed at each level (LRU replacement).
      </p>
    </div>
  );
}

function SchedulerView({ sim }: { sim: SimState }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-[11px] font-mono text-slate-300">
        <span>Algo: <span className="text-sky-300">{sim.schedulingAlgo}</span></span>
        <span>Quantum: <span className="text-sky-300">{sim.quantum}</span></span>
        <span>Left: <span className="text-amber-300">{sim.quantumLeft}</span></span>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
        {sim.processes.filter(p => p.state !== 'terminated').map(p => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-slate-800/40 border border-slate-700/50 px-2 py-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[11px] font-mono text-slate-200 w-20 truncate">{p.name}</span>
            <span className={`text-[10px] font-mono px-1.5 rounded ${stateColor(p.state)}`}>{p.state}</span>
            <span className="text-[10px] font-mono text-slate-500">PC {p.pc}</span>
            <div className="flex-1 h-1.5 bg-slate-700/40 rounded overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(1 - p.remaining / p.burst) * 100}%`, background: p.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function stateColor(s: string) {
  switch (s) {
    case 'running': return 'bg-sky-500/30 text-sky-200';
    case 'ready': return 'bg-emerald-500/20 text-emerald-200';
    case 'waiting': return 'bg-rose-500/20 text-rose-200';
    default: return 'bg-slate-600/30 text-slate-300';
  }
}

function PicView({ sim }: { sim: SimState }) {
  return (
    <div className="space-y-1">
      {sim.interrupts.length === 0 && <div className="text-[11px] text-slate-500 italic">No pending interrupts.</div>}
      {sim.interrupts.map(i => (
        <Row key={i.id} label={i.source}>Priority {i.priority} — {i.active ? 'ACTIVE' : 'done'}</Row>
      ))}
      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
        Devices raise interrupt requests (IRQs). The controller prioritizes them and signals the
        CPU, which saves its state and runs the interrupt service routine.
      </p>
    </div>
  );
}

function DmaView({ sim }: { sim: SimState }) {
  return (
    <div className="space-y-2">
      <Row label="Status">{sim.dmaActive ? 'Transferring' : 'Idle'}</Row>
      <Row label="Progress">{(sim.dmaProgress * 100).toFixed(0)}%</Row>
      <div className="h-2 bg-slate-700/40 rounded overflow-hidden">
        <div className="h-full bg-pink-400 transition-all" style={{ width: `${sim.dmaProgress * 100}%` }} />
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        DMA moves data between memory and a device without CPU involvement. The CPU starts the
        transfer, the DMA controller takes the bus, and the CPU is free to keep executing.
      </p>
    </div>
  );
}

function FsView({ sim }: { sim: SimState }) {
  void sim;
  const files = ['/', '/bin', '/etc', '/home', '/var', '/tmp'];
  return (
    <div className="space-y-1">
      {files.map((f, i) => (
        <div key={f} className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-amber-300">inode {1000 + i}</span>
          <span className="text-slate-300">{f}</span>
        </div>
      ))}
      <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
        The filesystem maps file paths to inodes, which point to disk blocks. Reads and writes
        flow through the kernel's VFS layer to the device driver and finally the disk.
      </p>
    </div>
  );
}

function GenericView({ id, sim }: { id: ComponentId; sim: SimState }) {
  const map: Record<string, string> = {
    alu: 'Performs arithmetic (ADD, SUB, MUL) and logic (AND, OR, CMP) operations on register operands.',
    controlUnit: 'Decodes the instruction in the IR and emits control signals directing the ALU, registers, and memory.',
    pc: 'Holds the address of the next instruction to fetch; increments by 4 each cycle or jumps on branches.',
    ir: 'Holds the currently fetched instruction while the Control Unit decodes it.',
    sp: 'Points to the top of the runtime stack in memory; used for function calls and interrupt state saving.',
    storage: 'Persistent block storage. Slow compared to RAM; accessed via DMA. Holds the filesystem.',
    nic: 'Sends and receives network packets. Uses DMA to move packet data to/from memory.',
    keyboard: 'Raises an interrupt on each keypress; the kernel reads the scancode via its driver.',
    mouse: 'Raises interrupts on movement and clicks; events are queued for user-space.',
    gpu: 'Renders the framebuffer via memory-mapped I/O; high-throughput parallel computation.',
    clock: 'Generates the timing pulse synchronizing every component. Every rising edge is one cycle.',
    timer: 'Fires periodic interrupts used by the scheduler to preempt running processes (time-slicing).',
    systemBus: 'The shared communication channel connecting CPU, memory, and I/O. Bundles address, data, and control lines.',
    addressBus: 'Unidirectional; carries the target address from the CPU to memory or I/O.',
    dataBus: 'Bidirectional; carries the actual data being read or written.',
    controlBus: 'Carries control signals: Read/Write, interrupt requests, bus arbitration, and clock.',
    kernel: 'The privileged core of the OS. Manages processes, memory, and devices; handles system calls and interrupts.',
    drivers: 'Kernel modules that translate generic I/O requests into device-specific commands and handle device interrupts.',
  };
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-300 leading-relaxed">{map[id] || 'Component detail.'}</p>
      {id === 'pc' && <Row label="Value">{sim.pc}</Row>}
      {id === 'ir' && <Row label="Instruction">{sim.ir}</Row>}
      {id === 'sp' && <Row label="Value">{sim.sp}</Row>}
      {id === 'clock' && <Row label="Cycle">{sim.cycle}</Row>}
      {id === 'timer' && <Row label="Quantum left">{sim.quantumLeft}</Row>}
    </div>
  );
}
