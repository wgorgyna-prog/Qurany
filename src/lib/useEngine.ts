import { useEffect, useState } from 'react'
import { health, type Health } from './muaalem'

// Polls the local Muaalem inference service. "offline" is a normal, expected
// state: the published app has no inference server yet.
export function useEngine() {
  const [state, setState] = useState<{ status: 'checking' | 'online' | 'starting' | 'offline'; info: Health | null }>({ status: 'checking', info: null })
  useEffect(() => {
    let stop = false
    let t: ReturnType<typeof setTimeout>
    const tick = async () => {
      try {
        const h = await health()
        if (stop) return
        setState({ status: h.model_loaded ? 'online' : 'starting', info: h })
        if (!h.model_loaded) t = setTimeout(tick, 4000)
      } catch {
        if (stop) return
        setState({ status: 'offline', info: null })
        t = setTimeout(tick, 20000)
      }
    }
    void tick()
    return () => {
      stop = true
      clearTimeout(t)
    }
  }, [])
  return state
}
