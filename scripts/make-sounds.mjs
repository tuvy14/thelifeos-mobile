// Synthesizes TheLifeOS's UI sound effects → assets/sounds/*.wav
// Tiny, soft, monochrome-minimal chimes (sine + a little harmonic warmth,
// exponential decay). Re-run with: node scripts/make-sounds.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "assets", "sounds");
mkdirSync(OUT, { recursive: true });

const SR = 44100;

// A single plucked note: sine fundamental + soft harmonics, fast attack, exp decay.
function note(freq, dur, { attack = 0.005, decay = dur, gain = 0.3, harmonics = [[1, 1]] } = {}) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / attack) * Math.exp(-t / (decay * 0.5));
    let s = 0;
    for (const [mult, amp] of harmonics) s += amp * Math.sin(2 * Math.PI * freq * mult * t);
    out[i] = s * env * gain;
  }
  return out;
}

// Mix notes placed at start-times (seconds), soft-clip the sum.
function mixSeq(parts) {
  const total = Math.max(...parts.map((p) => p.at + p.samples.length / SR));
  const n = Math.ceil(total * SR) + 64;
  const mix = new Float32Array(n);
  for (const p of parts) {
    const off = Math.floor(p.at * SR);
    for (let i = 0; i < p.samples.length; i++) mix[off + i] += p.samples[i];
  }
  for (let i = 0; i < n; i++) mix[i] = Math.tanh(mix[i]); // gentle saturation, no hard clip
  return mix;
}

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(join(OUT, name), buf);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
const soft = { harmonics: [[1, 1], [2, 0.15]], gain: 0.32 };
const warm = { harmonics: [[1, 1], [2, 0.2], [3, 0.08]], gain: 0.34 };

// success — gentle two-note rise (daily check-in saved)
writeWav("success.wav", mixSeq([
  { samples: note(C5, 0.16, { ...soft, decay: 0.18 }), at: 0 },
  { samples: note(E5, 0.26, { ...soft, decay: 0.28 }), at: 0.11 },
]));

// win — single warm ding (logged a small win)
writeWav("win.wav", mixSeq([
  { samples: note(G5, 0.34, { ...warm, decay: 0.4 }), at: 0 },
]));

// celebrate — rising arpeggio (streak milestones, unlocks)
writeWav("celebrate.wav", mixSeq([
  { samples: note(C5, 0.14, { ...soft, decay: 0.16 }), at: 0 },
  { samples: note(E5, 0.14, { ...soft, decay: 0.16 }), at: 0.09 },
  { samples: note(G5, 0.14, { ...soft, decay: 0.16 }), at: 0.18 },
  { samples: note(C6, 0.34, { ...warm, decay: 0.42 }), at: 0.27 },
]));

console.log("Wrote success.wav, win.wav, celebrate.wav →", OUT);
