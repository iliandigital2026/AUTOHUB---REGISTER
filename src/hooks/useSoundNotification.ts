import { useCallback, useRef } from 'react'

export function useSoundNotification() {
  const ctx = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctx.current) {
      ctx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return ctx.current
  }, [])

  const playNewOrder = useCallback(() => {
    try {
      const ac = getCtx()
      const now = ac.currentTime

      // Nota 1 — sol
      const o1 = ac.createOscillator()
      const g1 = ac.createGain()
      o1.connect(g1); g1.connect(ac.destination)
      o1.frequency.value = 784
      g1.gain.setValueAtTime(0, now)
      g1.gain.linearRampToValueAtTime(0.3, now + 0.01)
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      o1.start(now); o1.stop(now + 0.25)

      // Nota 2 — dó agudo
      const o2 = ac.createOscillator()
      const g2 = ac.createGain()
      o2.connect(g2); g2.connect(ac.destination)
      o2.frequency.value = 1046
      g2.gain.setValueAtTime(0, now + 0.18)
      g2.gain.linearRampToValueAtTime(0.35, now + 0.2)
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      o2.start(now + 0.18); o2.stop(now + 0.5)

      // Nota 3 — mi agudo
      const o3 = ac.createOscillator()
      const g3 = ac.createGain()
      o3.connect(g3); g3.connect(ac.destination)
      o3.frequency.value = 1318
      g3.gain.setValueAtTime(0, now + 0.38)
      g3.gain.linearRampToValueAtTime(0.3, now + 0.4)
      g3.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
      o3.start(now + 0.38); o3.stop(now + 0.75)

    } catch (e) {
      console.warn('Áudio não disponível:', e)
    }
  }, [getCtx])

  const playAlert = useCallback(() => {
    try {
      const ac = getCtx()
      const now = ac.currentTime
      ;[0, 0.15, 0.3].forEach(offset => {
        const o = ac.createOscillator()
        const g = ac.createGain()
        o.connect(g); g.connect(ac.destination)
        o.frequency.value = 440
        o.type = 'square'
        g.gain.setValueAtTime(0, now + offset)
        g.gain.linearRampToValueAtTime(0.1, now + offset + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12)
        o.start(now + offset); o.stop(now + offset + 0.12)
      })
    } catch (e) {
      console.warn('Áudio não disponível:', e)
    }
  }, [getCtx])

  return { playNewOrder, playAlert }
}
