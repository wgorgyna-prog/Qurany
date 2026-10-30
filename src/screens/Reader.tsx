import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { AyahMark, Bismillah } from '../components/Mushaf'
import { Button, Segmented, Sheet } from '../components/ui'
import { useL } from '../lib/i18n'
import { navigate } from '../lib/router'
import { hasBismillahHeader, surah, SURAHS } from '../lib/quran'
import { useSurah } from '../lib/useSurah'
import { useAyahPlayer } from '../lib/player'
import { addKnown, isMemorized, key, logDay, setState, toggleBookmark, updateActive, useActive, useStore } from '../lib/store'
import { today } from '../lib/date'

export function Reader({ n, focusAyah }: { n: number; focusAyah: number | null }) {
  const { L, N, A, lang } = useL()
  const meta = surah(Math.min(114, Math.max(1, n)))
  const { ayat, error } = useSurah(meta.n)
  const p = useActive()
  const reciterId = useStore((s) => s.reciter)
  const fontScale = useStore((s) => s.fontScale)
  const player = useAyahPlayer(reciterId)
  const [view, setView] = useState<'flow' | 'ayah'>('ayah')
  const [sheet, setSheet] = useState<number | null>(null)
  const [range, setRange] = useState<{ from: number; to: number | null } | null>(null)
  const [planSheet, setPlanSheet] = useState<{ from: number; to: number } | null>(null)
  const [readDone, setReadDone] = useState(false)
  const refs = useRef<Record<number, HTMLElement | null>>({})
  const lastSaved = useRef(0)

  const saveLast = (a: number) => {
    if (!p || lastSaved.current === a) return
    lastSaved.current = a
    updateActive((x) => ({ ...x, last: { s: meta.n, a, mode: 'read' } }))
  }

  // Jump to a requested ayah once text loads.
  useEffect(() => {
    if (ayat && focusAyah) setTimeout(() => refs.current[focusAyah]?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80)
  }, [ayat, focusAyah])

  // Remember reading position as the reader scrolls (ayah view).
  useEffect(() => {
    if (!ayat || view !== 'ayah') return
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.a))
        if (vis.length) saveLast(Math.min(...vis))
      },
      { rootMargin: '-40% 0px -50% 0px' },
    )
    Object.values(refs.current).forEach((el) => el && io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayat, view, meta.n])

  // Keep the playing ayah in view.
  useEffect(() => {
    if (player.playing) refs.current[player.playing.a]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [player.playing])

  const playFrom = (a: number) => {
    const go = (x: number) => player.play(meta.n, x, 1, () => (x < meta.ayat ? go(x + 1) : undefined))
    go(a)
    saveLast(a)
  }

  const tapAyah = (a: number) => {
    if (range) {
      if (range.to == null && a >= range.from) setRange({ from: range.from, to: a })
      else setRange({ from: a, to: null })
      return
    }
    setSheet(a)
    saveLast(a)
  }

  const sel = range ? { from: range.from, to: range.to ?? range.from } : null
  const inSel = (a: number) => !!sel && a >= sel.from && a <= sel.to
  const size = `${(view === 'flow' ? 1.75 : 1.95) * fontScale}rem`

  const prevS = meta.n > 1 ? SURAHS[meta.n - 2] : null
  const nextS = meta.n < 114 ? SURAHS[meta.n] : null

  return (
    <div className="pb-24">
      {/* Surah header */}
      <div className="pattern-night relative -mx-5 -mt-6 mb-8 overflow-hidden px-6 pb-8 pt-6 text-parchment md:mx-0 md:mt-0 md:rounded-[2rem]">
        <div className="flex items-center justify-between">
          <a href="#/quran" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label={L('المصحف', 'Quran')}>
            <Icon name="back" className={lang === 'ar' ? 'rotate-180' : ''} />
          </a>
          <div className="flex gap-2">
            <button type="button" onClick={() => setState((s) => ({ ...s, fontScale: Math.max(0.8, +(s.fontScale - 0.1).toFixed(2)) }))} className="h-10 rounded-full bg-white/10 px-3 text-sm" aria-label={L('تصغير الخط', 'Smaller text')}>
              أ-
            </button>
            <button type="button" onClick={() => setState((s) => ({ ...s, fontScale: Math.min(1.6, +(s.fontScale + 0.1).toFixed(2)) }))} className="h-10 rounded-full bg-white/10 px-3 text-lg" aria-label={L('تكبير الخط', 'Larger text')}>
              أ+
            </button>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="font-quran text-5xl leading-[1.6]">سُورَةُ {meta.ar}</p>
          <p className="mt-1 text-sm text-parchment/65">
            {lang === 'ar' ? `${meta.place === 'makkah' ? 'مكية' : 'مدنية'} · ${A(meta.ayat)} · الصفحة ${N(meta.pages[0])}` : `${meta.en} · ${meta.meaning} · ${meta.ayat} ayat`}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="gold" size="sm" onClick={() => (player.playing ? player.stop() : playFrom(focusAyah ?? 1))}>
              <Icon name={player.playing ? 'pause' : 'play'} size={16} fill />
              {player.playing ? L('إيقاف', 'Stop') : L('استمع', 'Listen')}
            </Button>
            <Button variant="soft" size="sm" className="bg-white/10 text-parchment hover:bg-white/20" onClick={() => setRange(range ? null : { from: 1, to: null })}>
              <Icon name="layers" size={16} />
              {range ? L('إلغاء التحديد', 'Cancel selection') : L('تحديد آيات', 'Select ayat')}
            </Button>
          </div>
          {player.error && <p className="mt-3 text-sm text-gold-soft">{L('تعذّر تشغيل الصوت. تحقّق من الاتصال بالإنترنت.', 'Couldn’t play audio. Check your internet connection.')}</p>}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'ayah', label: L('آية آية', 'By ayah') },
            { value: 'flow', label: L('صفحة متصلة', 'Flowing') },
          ]}
        />
        {range && <span className="text-sm text-muted">{range.to == null ? L('اختر آية النهاية', 'Tap the last ayah') : L(`المحدّد: ${A(sel!.to - sel!.from + 1)}`, `${sel!.to - sel!.from + 1} ayat selected`)}</span>}
      </div>

      {error && <p className="rounded-2xl bg-clay/10 p-4 text-clay">{L('تعذّر تحميل نص السورة.', 'Couldn’t load the surah text.')}</p>}
      {!ayat && !error && <div className="h-64 animate-pulse rounded-3xl bg-night/5" />}

      {ayat && (
        <article dir="rtl" lang="ar" className="mx-auto max-w-3xl">
          {hasBismillahHeader(meta.n) && <Bismillah className="mb-6" />}
          {view === 'flow' ? (
            <p className="mushaf rounded-[2rem] bg-card px-6 py-8 text-justify text-night ring-1 ring-line md:px-10" style={{ fontSize: size }}>
              {ayat.map((t, i) => {
                const a = i + 1
                const on = player.playing?.a === a
                return (
                  <span
                    key={a}
                    ref={(el) => {
                      refs.current[a] = el
                    }}
                    data-a={a}
                    role="button"
                    tabIndex={0}
                    onClick={() => tapAyah(a)}
                    onKeyDown={(e) => e.key === 'Enter' && tapAyah(a)}
                    className={`cursor-pointer rounded-lg transition-colors ${on ? 'bg-gold-soft/70' : inSel(a) ? 'bg-leaf/15' : focusAyah === a ? 'bg-gold-soft/35' : 'hover:bg-night/5'}`}
                  >
                    {t}
                    <AyahMark n={a} />{' '}
                  </span>
                )
              })}
            </p>
          ) : (
            <ol className="space-y-3">
              {ayat.map((t, i) => {
                const a = i + 1
                const on = player.playing?.a === a
                const mem = p && isMemorized(p, meta.n, a)
                const saved = p?.bookmarks.includes(key(meta.n, a))
                return (
                  <li
                    key={a}
                    ref={(el) => {
                      refs.current[a] = el
                    }}
                    data-a={a}
                  >
                    <button
                      type="button"
                      onClick={() => tapAyah(a)}
                      className={`block w-full rounded-[1.6rem] px-6 py-5 text-right ring-1 transition ${on ? 'bg-gold-soft/45 ring-gold' : inSel(a) ? 'bg-leaf/10 ring-leaf/50' : focusAyah === a ? 'bg-card ring-gold/60' : 'bg-card ring-line hover:ring-night/25'}`}
                    >
                      <span className="mushaf block text-night" style={{ fontSize: size }}>
                        {t}
                        <AyahMark n={a} />
                      </span>
                      <span className="mt-1 flex items-center justify-end gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        {mem && <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] text-leaf">{L('محفوظة', 'Memorised')}</span>}
                        {saved && <Icon name="bookmark" size={16} fill className="text-gold" />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}

          <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-10 rounded-[2rem] bg-card p-6 text-center ring-1 ring-line">
            <p className="font-arabic-display text-2xl">{L('نهاية السورة', 'End of the surah')}</p>
            {p && (
              <Button
                variant={readDone ? 'soft' : 'primary'}
                className="mt-4"
                disabled={readDone}
                onClick={() => {
                  updateActive((x) => ({ ...logDay(x, { read: meta.ayat, minutes: 0 }), last: { s: meta.n, a: meta.ayat, mode: 'read' } }))
                  setReadDone(true)
                }}
              >
                <Icon name="check" size={18} />
                {readDone ? L('سُجّلت قراءتك اليوم', 'Logged for today') : L('أتممت قراءة السورة', 'I finished reading this surah')}
              </Button>
            )}
            <div className="mt-6 flex justify-between gap-3 text-sm">
              {prevS ? (
                <a href={`#/surah/${prevS.n}`} className="text-muted hover:text-night">
                  {lang === 'ar' ? `→ ${prevS.ar}` : `← ${prevS.en}`}
                </a>
              ) : (
                <span />
              )}
              {nextS && (
                <a href={`#/surah/${nextS.n}`} className="font-medium text-leaf">
                  {lang === 'ar' ? `${nextS.ar} ←` : `${nextS.en} →`}
                </a>
              )}
            </div>
          </div>
        </article>
      )}

      {/* Range action bar */}
      {sel && range?.to != null && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 px-4 md:bottom-6 md:start-64">
          <div className="rise mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-[1.6rem] bg-night p-3 text-parchment shadow-2xl">
            <span className="px-2 text-sm">{L(`الآيات ${N(sel.from)}–${N(sel.to)}`, `Ayat ${sel.from}–${sel.to}`)}</span>
            <div className="ms-auto flex flex-wrap gap-2">
              <Button size="sm" variant="gold" href={`#/memorize?s=${meta.n}&from=${sel.from}&to=${sel.to}`}>
                {L('احفظ', 'Memorise')}
              </Button>
              <Button size="sm" variant="soft" className="bg-white/10 text-parchment" onClick={() => setPlanSheet(sel)}>
                {L('إلى خطتي', 'Add to plan')}
              </Button>
              <Button size="sm" variant="soft" className="bg-white/10 text-parchment" href={`#/recite?s=${meta.n}&from=${sel.from}&to=${sel.to}`}>
                {L('سمّع', 'Recite')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ayah actions */}
      <Sheet open={sheet != null} onClose={() => setSheet(null)} title={lang === 'ar' ? `${meta.ar} · الآية ${N(sheet ?? 0)}` : `${meta.en} · ayah ${sheet}`}>
        {sheet != null && ayat && (
          <div>
            <p dir="rtl" lang="ar" className="mushaf rounded-2xl bg-card p-5 text-[1.6rem] ring-1 ring-line">
              {ayat[sheet - 1]}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SheetAction icon="play" label={L('استمع من هنا', 'Listen from here')} onClick={() => (playFrom(sheet), setSheet(null))} />
              <SheetAction icon="repeat" label={L('كرّر الآية ٣ مرات', 'Repeat 3 times')} onClick={() => (player.play(meta.n, sheet, 3), setSheet(null))} />
              <SheetAction icon="sprout" label={L('احفظ من هنا', 'Memorise from here')} onClick={() => navigate(`/memorize?s=${meta.n}&from=${sheet}&to=${Math.min(meta.ayat, sheet + (p?.dailyAyat ?? 3) - 1)}`)} />
              <SheetAction icon="mic" label={L('سمّع هذه الآية', 'Recite this ayah')} onClick={() => navigate(`/recite?s=${meta.n}&from=${sheet}&to=${sheet}`)} />
              <SheetAction icon="bookmark" label={p?.bookmarks.includes(key(meta.n, sheet)) ? L('إزالة العلامة', 'Remove bookmark') : L('علامة', 'Bookmark')} onClick={() => (toggleBookmark(meta.n, sheet), setSheet(null))} />
              <SheetAction icon="layers" label={L('حدّد نطاقًا من هنا', 'Select range from here')} onClick={() => (setRange({ from: sheet, to: null }), setSheet(null))} />
            </div>
          </div>
        )}
      </Sheet>

      <AddToPlanSheet range={planSheet} s={meta.n} onClose={() => (setPlanSheet(null), setRange(null))} />
    </div>
  )
}

function SheetAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-start text-sm ring-1 ring-line hover:ring-night/30">
      <Icon name={icon} size={20} className="text-gold" />
      {label}
    </button>
  )
}

export function AddToPlanSheet({ range, s, onClose }: { range: { from: number; to: number } | null; s: number; onClose: () => void }) {
  const { L, N, lang } = useL()
  const p = useActive()
  const meta = surah(s)
  const [done, setDone] = useState<string | null>(null)
  const label = useMemo(() => (range ? (lang === 'ar' ? `${meta.ar} ${N(range.from)}–${N(range.to)}` : `${meta.en} ${range.from}–${range.to}`) : ''), [range, lang, meta, N])
  if (!p) return null
  const close = () => (setDone(null), onClose())
  return (
    <Sheet open={!!range} onClose={close} title={L('إضافة إلى خطتي', 'Add to my plan')}>
      {done ? (
        <div className="text-center">
          <p className="font-arabic-display text-2xl">{done}</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button href="#/plan" onClick={close}>
              {L('افتح الخطة', 'Open plan')}
            </Button>
            <Button variant="outline" onClick={close}>
              {L('متابعة القراءة', 'Keep reading')}
            </Button>
          </div>
        </div>
      ) : (
        range && (
          <div className="space-y-3">
            <p className="text-muted">{label}</p>
            <button
              type="button"
              className="w-full rounded-2xl bg-card p-4 text-start ring-1 ring-line hover:ring-night/30"
              onClick={() => {
                updateActive((x) => ({ ...x, plan: { s, from: range.from, to: range.to, dailyAyat: x.dailyAyat, startedAt: today() } }))
                setDone(L('أصبحت وِرد حفظك الحالي', 'This is now your memorisation portion'))
              }}
            >
              <span className="block font-semibold">{L('اجعلها وِرد الحفظ الحالي', 'Make it my current memorisation')}</span>
              <span className="block text-sm text-muted">{p.plan ? L(`بدلًا من ${surah(p.plan.s).ar} ${N(p.plan.from)}–${N(p.plan.to)}`, `Replaces ${surah(p.plan.s).en} ${p.plan.from}–${p.plan.to}`) : L(`${N(p.dailyAyat)} آيات يوميًا`, `${p.dailyAyat} ayat a day`)}</span>
            </button>
            <button
              type="button"
              className="w-full rounded-2xl bg-card p-4 text-start ring-1 ring-line hover:ring-night/30"
              onClick={() => {
                updateActive((x) => addKnown(x, s, range.from, range.to))
                setDone(L('أُضيفت إلى محفوظاتك وجدول المراجعة', 'Added to what you know and to revision'))
              }}
            >
              <span className="block font-semibold">{L('أحفظها مسبقًا، أضفها للمراجعة', 'I already know these: add to revision')}</span>
              <span className="block text-sm text-muted">{L('ستُوزَّع مراجعتها على الأيام القادمة', 'Their revision will be spread over the coming days')}</span>
            </button>
          </div>
        )
      )}
    </Sheet>
  )
}
