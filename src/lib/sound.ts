let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.08, delay = 0) {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = 0
  osc.connect(g)
  g.connect(audioCtx.destination)
  const start = audioCtx.currentTime + delay
  osc.start(start)
  g.gain.linearRampToValueAtTime(gain, start + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.stop(start + duration + 0.02)
}

function tactilePop() {
  const audioCtx = getCtx()
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const g = audioCtx.createGain()
  osc.type = 'sine'
  const start = audioCtx.currentTime
  osc.frequency.setValueAtTime(540, start)
  osc.frequency.exponentialRampToValueAtTime(220, start + 0.04)
  g.gain.setValueAtTime(0.06, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.04)
  osc.connect(g)
  g.connect(audioCtx.destination)
  osc.start(start)
  osc.stop(start + 0.05)
}

export const sfx = {
  click: tactilePop,
  cartridge: () => {
    tactilePop()
    setTimeout(() => tone(440, 0.06, 'triangle', 0.05), 40)
  },
  score: () => {
    tone(660, 0.09, 'square', 0.06)
    tone(880, 0.12, 'square', 0.05, 0.06)
  },
  correct: () => {
    tone(523, 0.1, 'sine', 0.07)
    tone(784, 0.14, 'sine', 0.06, 0.08)
  },
  wrong: () => tone(150, 0.22, 'sawtooth', 0.06),
  gameOver: () => {
    tone(392, 0.14, 'triangle', 0.07)
    tone(261, 0.22, 'triangle', 0.06, 0.12)
  },
  achievement: () => {
    tone(523, 0.1, 'sine', 0.07)
    tone(659, 0.1, 'sine', 0.07, 0.09)
    tone(784, 0.18, 'sine', 0.07, 0.18)
  },
  levelUp: () => {
    tone(440, 0.09, 'square', 0.06)
    tone(554, 0.09, 'square', 0.06, 0.08)
    tone(659, 0.16, 'square', 0.06, 0.16)
  },
}

export function playSfx(name: keyof typeof sfx, enabled: boolean) {
  if (!enabled) return
  try {
    sfx[name]()
  } catch {

  }
}
