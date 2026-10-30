import { Icon } from '../components/Icon'
import { SurahBadge } from '../components/Mushaf'
import { Bar, Button, Card, ProgressRing, Section } from '../components/ui'
import { useL } from '../lib/i18n'
import { surah } from '../lib/quran'
import { activeDays, completedSurahs, memorizedCount, revisionTasks, todaysHifz, useActive, useStore, type RevisionTask } from '../lib/store'
import { today } from '../lib/date'

export function greeting(L: (a: string, e: string) => string) {
  const h = new Date().getHours()
  return h < 12 ? L('صباح الخير', 'Good morning') : h < 18 ? L('طاب يومك', 'Good afternoon') : L('مساء الخير', 'Good evening')
}

export const rangeLabel = (L: (a: string, e: string) => string, N: (n: number) => string, s: number, from: number, to: number, lang: string) => {
  const name = lang === 'ar' ? surah(s).ar : surah(s).en
  if (from === 1 && to === surah(s).ayat) return `${name}`
  return from === to ? `${name} · ${L('آية', 'ayah')} ${N(from)}` : `${name} · ${N(from)}–${N(to)}`
}

export function Home() {
  const { L, N, A, lang } = useL()
  const p = useActive()!
  const assignments = useStore((s) => s.assignments)
  const submissions = useStore((s) => s.submissions)
  const hifz = todaysHifz(p)
  const tasks = revisionTasks(p)
  const overdue = tasks.filter((t) => t.overdue > 0)
  const dueAyat = tasks.reduce((a, t) => a + t.count, 0)
  const mine = assignments.filter((a) => a.learnerId === p.id && !a.doneAt)
  const feedback = submissions.filter((s) => s.learnerId === p.id && s.teacher && !s.seenByLearner)
  const memorized = memorizedCount(p)
  const done = completedSurahs(p)
  const todayLog = p.log[today()]

  return (
    <div className="space-y-10">
      <header className="rise">
        <p className="text-muted">{greeting(L)}</p>
        <h1 className="mt-1 font-arabic-display text-[2.3rem] leading-tight md:text-5xl">{p.name}</h1>
        <p className="mt-2 max-w-xl text-[15px] text-muted">
          {hifz && !hifz.done && hifz.next.length === 0
            ? L('أتممتَ وِردَ الحفظ اليوم. بارك الله فيك.', 'You’ve completed today’s memorisation. May Allah bless it.')
            : dueAyat > 0
              ? L(`لديك للمراجعة اليوم ${A(dueAyat)}.`, `${A(dueAyat)} due for revision today.`)
              : L('خطوة صغيرة اليوم تكفي.', 'A small step today is enough.')}
        </p>
      </header>

      {(mine.length > 0 || feedback.length > 0) && (
        <Section title={L('من معلّمك', 'From your teacher')}>
          <div className="grid gap-3 md:grid-cols-2">
            {mine.map((a) => (
              <Card key={a.id} href={a.kind === 'memorize' ? `#/memorize?s=${a.s}&from=${a.from}&to=${a.to}&assignment=${a.id}` : a.kind === 'revise' ? `#/revise?s=${a.s}&from=${a.from}&to=${a.to}&assignment=${a.id}` : `#/recite?s=${a.s}&from=${a.from}&to=${a.to}&assignment=${a.id}`} className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky/10 text-sky">
                  <Icon name={a.kind === 'recite' ? 'mic' : a.kind === 'revise' ? 'repeat' : 'sprout'} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-sky">{a.kind === 'memorize' ? L('حفظ جديد', 'New memorisation') : a.kind === 'revise' ? L('مراجعة', 'Revision') : L('تسميع', 'Recitation')}</span>
                  <span className="block font-semibold">{rangeLabel(L, N, a.s, a.from, a.to, lang)}</span>
                  {a.note && <span className="mt-0.5 block truncate text-sm text-muted">“{a.note}”</span>}
                </span>
                <Icon name="chevron" className={`text-muted ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Card>
            ))}
            {feedback.map((s) => (
              <Card key={s.id} href={`#/recite?feedback=${s.id}`} className="flex items-center gap-4 p-5">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.teacher!.verdict === 'good' ? 'bg-leaf/10 text-leaf' : 'bg-gold-soft/60 text-night'}`}>
                  <Icon name={s.teacher!.verdict === 'good' ? 'star' : 'heart'} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-muted">{L('ملاحظة على تسميعك', 'Feedback on your recitation')}</span>
                  <span className="block font-semibold">{s.teacher!.verdict === 'good' ? L('أحسنت! تسميع متقن', 'Well done! A solid recitation') : L('تحتاج إلى مراجعة يسيرة', 'A little more practice')}</span>
                  <span className="block truncate text-sm text-muted">{rangeLabel(L, N, s.s, s.from, s.to, lang)}</span>
                </span>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Today's memorisation */}
        <div className="pattern-night relative overflow-hidden rounded-[2rem] p-6 text-parchment md:p-8 lg:col-span-3">
          {p.path === 'hifz' && hifz ? (
            hifz.done ? (
              <div>
                <p className="text-sm text-gold-soft">{L('وِرد الحفظ', 'Memorisation')}</p>
                <h2 className="mt-2 font-arabic-display text-3xl">{L(`أتممت حفظ سورة ${surah(hifz.s).ar}`, `You completed ${surah(hifz.s).en}`)}</h2>
                <p className="mt-2 text-parchment/70">{L('اختر الموضع التالي لتكمل رحلتك.', 'Choose what to memorise next.')}</p>
                <Button variant="gold" className="mt-6" href="#/plan">
                  {L('اختر الورد التالي', 'Choose next portion')}
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gold-soft">{L('وِرد الحفظ اليوم', 'Today’s memorisation')}</p>
                    <h2 className="mt-2 font-arabic-display text-3xl md:text-4xl">{lang === 'ar' ? `سورة ${surah(hifz.s).ar}` : surah(hifz.s).en}</h2>
                    <p className="mt-1 text-parchment/70">
                      {hifz.next.length > 1
                        ? L(`الآيات ${N(hifz.next[0])}–${N(hifz.next[hifz.next.length - 1])}`, `Ayat ${hifz.next[0]}–${hifz.next[hifz.next.length - 1]}`)
                        : hifz.next.length === 1
                          ? L(`الآية ${N(hifz.next[0])}`, `Ayah ${hifz.next[0]}`)
                          : L('أتممت هدف اليوم', 'Today’s goal is done')}
                    </p>
                  </div>
                  <ProgressRing value={hifz.learnedToday / Math.max(1, hifz.goal)} size={68} tone="gold">
                    <span className="text-center text-[11px] leading-tight text-parchment">
                      {L(`${N(Math.min(hifz.learnedToday, hifz.goal))} من ${N(hifz.goal)}`, `${Math.min(hifz.learnedToday, hifz.goal)} of ${hifz.goal}`)}
                    </span>
                  </ProgressRing>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {hifz.next.length > 0 ? (
                    <Button variant="gold" size="lg" href={`#/memorize?s=${hifz.s}&from=${hifz.next[0]}&to=${hifz.next[hifz.next.length - 1]}`}>
                      <Icon name="play" size={18} fill />
                      {L('ابدأ جلسة الحفظ', 'Start session')}
                    </Button>
                  ) : (
                    <Button variant="soft" size="lg" href={`#/recite?s=${hifz.s}&from=1&to=${surah(hifz.s).ayat}`}>
                      <Icon name="mic" size={18} />
                      {L('سمّع ما حفظت', 'Recite what you learned')}
                    </Button>
                  )}
                  <span className="text-sm text-parchment/60">
                    {L(`بقي ${N(hifz.remainingTotal)} من ${A(hifz.total)} في الورد`, `${hifz.remainingTotal} of ${hifz.total} ayat left in this portion`)}
                  </span>
                </div>
                <Bar value={1 - hifz.remainingTotal / hifz.total} className="mt-6 bg-white/10" tone="bg-gold" />
              </div>
            )
          ) : p.last ? (
            <div>
              <p className="text-sm text-gold-soft">{L('وِرد التلاوة', 'Today’s reading')}</p>
              <h2 className="mt-2 font-arabic-display text-3xl">{lang === 'ar' ? `سورة ${surah(p.last.s).ar}` : surah(p.last.s).en}</h2>
              <p className="mt-1 text-parchment/70">{L(`تابع من الآية ${N(p.last.a)} · ${N(p.dailyMinutes)} دقائق`, `Continue from ayah ${p.last.a} · ${p.dailyMinutes} min`)}</p>
              <Button variant="gold" size="lg" className="mt-6" href={`#/surah/${p.last.s}?a=${p.last.a}`}>
                <Icon name="book" size={18} />
                {L('تابع القراءة', 'Continue reading')}
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gold-soft">{L('ابدأ وردك', 'Begin your portion')}</p>
              <h2 className="mt-2 font-arabic-display text-3xl">{L('افتح المصحف واختر سورة', 'Open the Quran and pick a surah')}</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="gold" size="lg" href="#/surah/1">
                  {L('ابدأ بالفاتحة', 'Start with Al-Fatiha')}
                </Button>
                {p.path === 'hifz' && (
                  <Button variant="soft" size="lg" href="#/plan">
                    {L('اختر خطة حفظ', 'Choose a hifz plan')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Revision */}
        <Card className="flex flex-col p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">{L('مراجعة اليوم', 'Today’s revision')}</p>
            {overdue.length > 0 && <span className="rounded-full bg-clay/10 px-2.5 py-1 text-xs text-clay">{L(`${N(overdue.length)} متأخرة`, `${overdue.length} overdue`)}</span>}
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center py-4">
              <p className="font-arabic-display text-2xl">{memorized ? L('لا مراجعة مستحقّة اليوم', 'Nothing due today') : L('ستظهر هنا مراجعتك', 'Revision will appear here')}</p>
              <p className="mt-1 text-sm text-muted">{memorized ? L('ما حفظته في أمان. سنذكّرك في الوقت المناسب.', 'What you know is safe. We’ll remind you at the right time.') : L('بعد أن تحفظ أول آية.', 'Once you memorise your first ayah.')}</p>
            </div>
          ) : (
            <>
              <p className="mt-2 font-arabic-display text-3xl">{A(dueAyat)}</p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {tasks.slice(0, 3).map((t) => (
                  <TaskRow key={`${t.s}-${t.from}`} t={t} />
                ))}
                {tasks.length > 3 && <li className="text-sm text-muted">{L(`و${N(tasks.length - 3)} مواضع أخرى`, `and ${tasks.length - 3} more portions`)}</li>}
              </ul>
              <Button className="mt-4 w-full" href="#/revise?due=1">
                <Icon name="repeat" size={18} />
                {L('ابدأ المراجعة', 'Start revision')}
              </Button>
            </>
          )}
        </Card>
      </div>

      <Section title={L('وصول سريع', 'Quick access')}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '#/quran', icon: 'book', ar: 'المصحف', en: 'Quran', sub: L('اقرأ واستمع', 'Read & listen') },
            { href: '#/plan', icon: 'sprout', ar: 'خطة الحفظ', en: 'Hifz plan', sub: L('الورد والمراجعة', 'Goal & revision') },
            { href: '#/recite', icon: 'mic', ar: 'التسميع', en: 'Recite', sub: L('سجّل تلاوتك', 'Record yourself') },
          ].map((x) => (
            <Card key={x.href} href={x.href} className="p-4 md:p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft/50">
                <Icon name={x.icon} />
              </span>
              <span className="mt-3 block font-semibold">{L(x.ar, x.en)}</span>
              <span className="block text-xs text-muted">{x.sub}</span>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={L('رحلتك حتى الآن', 'Your journey so far')} action={<a href="#/journey" className="text-sm text-leaf">{L('التفاصيل', 'Details')}</a>}>
        <Card className="grid grid-cols-3 p-2 [&>*+*]:border-s [&>*+*]:border-line">
          <Stat value={N(memorized)} label={L('آية محفوظة', 'ayat memorised')} />
          <Stat value={N(done.length)} label={L('سورة مكتملة', 'surahs complete')} />
          <Stat value={N(activeDays(p))} label={L('يومًا من آخر ٣٠', 'of the last 30 days')} />
        </Card>
        {todayLog && todayLog.revised + todayLog.memorized > 0 && (
          <p className="text-sm text-muted">
            {L(`اليوم: حفظت ${N(todayLog.memorized)} وراجعت ${N(todayLog.revised)} آية.`, `Today: ${todayLog.memorized} memorised, ${todayLog.revised} revised.`)}
          </p>
        )}
      </Section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="font-arabic-display text-3xl text-night">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}

export function TaskRow({ t, start = false }: { t: RevisionTask; start?: boolean }) {
  const { L, N, A, lang } = useL()
  const body = (
    <>
      <SurahBadge n={t.s} size={34} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{rangeLabel(L, N, t.s, t.from, t.to, lang)}</span>
        <span className={`block text-xs ${t.overdue > 0 ? 'text-clay' : 'text-muted'}`}>
          {t.overdue > 0 ? L(`متأخرة ${t.overdue === 1 ? 'يومًا' : t.overdue === 2 ? 'يومين' : `${N(t.overdue)} ${t.overdue <= 10 ? 'أيام' : 'يومًا'}`}`, `${t.overdue} day${t.overdue > 1 ? 's' : ''} overdue`) : L('مستحقّة اليوم', 'Due today')} · {A(t.count)}
        </span>
      </span>
    </>
  )
  if (!start)
    return <li className="flex items-center gap-3">{body}</li>
  return (
    <li>
      <a href={`#/revise?s=${t.s}&from=${t.from}&to=${t.to}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-night/5">
        {body}
        <Icon name="chevron" className={`text-muted ${lang === 'ar' ? 'rotate-180' : ''}`} />
      </a>
    </li>
  )
}
