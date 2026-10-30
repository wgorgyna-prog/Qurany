import { useEffect, useState } from 'react'
import { loadSurah } from './quran'

export function useSurah(n: number | null) {
  const [ayat, setAyat] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!n) return
    let live = true
    setAyat(null)
    setError(null)
    loadSurah(n)
      .then((a) => live && setAyat(a))
      .catch((e) => live && setError(String(e)))
    return () => {
      live = false
    }
  }, [n])
  return { ayat, error }
}
