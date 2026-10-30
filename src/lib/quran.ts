import index from '../data/surahs.json'

// Verified text: Tanzil Uthmani 1.1 (CC BY 3.0), split per surah into
// public/quran/{n}.json. Never edited, never generated.
export type SurahMeta = { n: number; ar: string; en: string; meaning: string; place: string; ayat: number; pages: number[] }
export const SURAHS = index.surahs as SurahMeta[]
export const BISMILLAH = index.bismillah
export const QURAN_SOURCE = index.source
export const surah = (n: number) => SURAHS[n - 1]

const cache = new Map<number, Promise<string[]>>()
export function loadSurah(n: number): Promise<string[]> {
  if (!cache.has(n)) {
    const p = fetch(`${import.meta.env.BASE_URL}quran/${n}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: { ayat: string[] }) => d.ayat)
    p.catch(() => cache.delete(n))
    cache.set(n, p)
  }
  return cache.get(n)!
}

export const words = (ayah: string) => ayah.split(' ').filter(Boolean)

/** First grapheme (letter + its harakat) of a word, used as a recall cue. */
export function firstLetter(word: string) {
  type Seg = new (l: string, o: { granularity: 'grapheme' }) => { segment(s: string): Iterable<{ segment: string }> }
  const Ctor = (Intl as unknown as { Segmenter?: Seg }).Segmenter
  const seg = Ctor ? new Ctor('ar', { granularity: 'grapheme' }) : null
  if (seg) {
    for (const s of seg.segment(word)) return s.segment
  }
  return word.slice(0, 2)
}

export const hasBismillahHeader = (n: number) => n !== 1 && n !== 9

export const toAr = (n: number | string) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])

// Juz 'Amma (78–114), the usual starting point for children and new huffaz.
export const JUZ_AMMA = Array.from({ length: 37 }, (_, i) => 78 + i)
export const SHORT_SURAHS_FOR_KIDS = [1, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101]

export type Reciter = { id: string; ar: string; en: string; folder: string }
// Per-ayah recordings streamed from EveryAyah.com (not bundled).
export const RECITERS: Reciter[] = [
  { id: 'husary', ar: 'محمود خليل الحصري (مرتّل)', en: 'Al-Husary (murattal)', folder: 'Husary_128kbps' },
  { id: 'husary_muallim', ar: 'الحصري (المصحف المعلّم)', en: 'Al-Husary (teaching)', folder: 'Husary_Muallim_128kbps' },
  { id: 'minshawi', ar: 'محمد صديق المنشاوي (مرتّل)', en: 'Al-Minshawi (murattal)', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'alafasy', ar: 'مشاري راشد العفاسي', en: 'Mishary Alafasy', folder: 'Alafasy_128kbps' },
]
export const reciter = (id: string) => RECITERS.find((r) => r.id === id) ?? RECITERS[0]
export const ayahAudioUrl = (reciterId: string, s: number, a: number) =>
  `https://everyayah.com/data/${reciter(reciterId).folder}/${String(s).padStart(3, '0')}${String(a).padStart(3, '0')}.mp3`
