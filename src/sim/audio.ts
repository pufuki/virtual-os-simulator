// Web Audio API Synthesizer for OS Simulator
// Synthesizes futuristic, subtle audio effects without external audio files.

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('os_sim_sound');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('os_sim_sound', String(enabled));
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Component selection / focus blip sound
  public playComponentClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Electrical signal pulse sound
  public playSignalPulse(kind?: string) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const now = this.ctx.currentTime;

    // Frequencies tailored to signal kind
    let freq = 800;
    let type: OscillatorType = 'sine';
    let duration = 0.04;

    switch (kind) {
      case 'interrupt':
      case 'mouseEvent':
        freq = 1400;
        type = 'triangle';
        duration = 0.05;
        break;
      case 'disk':
        freq = 320;
        type = 'sawtooth';
        duration = 0.06;
        break;
      case 'packet':
        freq = 1050;
        type = 'sine';
        duration = 0.04;
        break;
      case 'gpuRender':
        freq = 650;
        type = 'sine';
        duration = 0.05;
        break;
      case 'syscall':
        freq = 900;
        type = 'square';
        duration = 0.04;
        break;
      default:
        freq = 750 + Math.random() * 200;
        type = 'sine';
        duration = 0.035;
        break;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + duration);

    gain.gain.setValueAtTime(0.03, now); // soft, subtle volume
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Event injection chime
  public playEventInject() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.05); // E5

    osc2.frequency.setValueAtTime(1046.5, now); // C6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }
}

export const sound = new SoundManager();
