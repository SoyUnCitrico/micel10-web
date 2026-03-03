import * as Tone from 'tone';

let started = false;
const startAudio = async () => {
  if (!started) {
    await Tone.start(); // needs user gesture first
    started = true;
  }
};

// 4-pole lowpass filter with modulation
const filter = new Tone.Filter({
  type: 'lowpass',
  frequency: 900,
  rolloff: -24,
  Q: 8,
}).toDestination();

// Slow LFO for cutoff (breathing sweep)
const cutoffLfo = new Tone.LFO({
  frequency: 0.2,
  min: 350,
  max: 2400,
}).start();
cutoffLfo.connect(filter.frequency);

// LFO for resonance plus a coupled light detune wobble
const resLfo = new Tone.LFO({
  frequency: 0.09,
  min: 4,
  max: 10,
}).start();
resLfo.connect(filter.Q);

const resDetuneLfo = new Tone.LFO({
  frequency: 0.074,
  min: -2,
  max: 2,
}).start();

// Dual triangle, octave apart, slight detune, AHD envelope, through filter
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle' },
  detune: 0,
  envelope: {
    attack: 0.02,
    decay: 0.85,
    sustain: 0.0,
    release: 0.85,
  },
  filterEnvelope: undefined,
});

synth.connect(filter);
// Guarded detune modulation to avoid undefined param errors
if (filter.detune) {
  resDetuneLfo.connect(filter.detune);
}

// Helper to trigger a note with two osc voices an octave apart and slightly detuned
const playNodeTone = (note) => {
  const now = Tone.now();
  const voices = [
    { note, detune: -6 },
    { note: Tone.Frequency(note).transpose(-12), detune: +6 },
  ];
  voices.forEach((v) => {
    synth.set({ detune: v.detune });
    synth.triggerAttack(v.note, now);
  });
};

// Stop all voices
const stopNodeTone = () => synth.releaseAll();

export { startAudio, playNodeTone, stopNodeTone };