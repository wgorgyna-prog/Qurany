import { useState } from 'react'
import { Icon } from '../components/Icon'
import { SurahBadge } from '../components/Mushaf'
import { RangePicker, type Range } from '../components/RangePicker'
import { Bar, Button, Card, Empty, ScreenHeader, Section, Sheet, Stepper } from '../components/ui'
import { useL } from '../lib/i18n'
import { surah, SURAHS } from '../lib/quran'
import { addKnown, memorizedCount, revisionTasks, todaysHifz, upcomingRevisionCounts, updateActive, useActive } from '../lib/store'
import { today } from '../lib/date'
import { TaskRow } from './Home'

export function PlanScreen() {
  const { L, N, A, lang } = useL()
  const p = useActive()!
  const hifz = todaysHifz(p)
  const tasks = revisionTasks(p)
  const overdue = tasks.filter((t) => t.overdue > 0)
  const dueToday = tasks.filter((t) => t.overdue === 0)
  const week = upcomingRevisionCounts(p)
  const peak = Math.max(1, ...week.map((d) => d.count))
  const [editing, setEditing] = useState(false)
  const [known, setKnown] = useState(false)
  const memorizedSurahs = SURAHS.filter((s) => memorizedCount(p, s.n) > 0)
  const daysLeft = hifz ? Math.ceil(hifz.remainingTotal / Math.max(1, hifz.goal)) : 0
  const dayName = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString(lang === 'ar' ? 'ar' : 'en', { weekday: 'short' })

  return (
    <div className="space-y-10">
      <ScreenHeader title={L('خطة الحفظ والمراجعة', 'Memorisation & revision')} subtitle={L('هدف واضح كل يوم، ومراجعة تأتي في وقتها', 'A clear goal each day, and revision on time')} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{L('الورد الحالي', 'Current portion')}</p>
              {p.plan ? (
                <>
                  <p className="mt-1 font-arabic-display text-3xl">{lang === 'ar' ? `سورة ${surah(p.plan.s).ar}` : surah(p.plan.s).en}</p>
                  <p className="text-sm text-muted">{L(`الآيات ${N(p.plan.from)}–${N(p.plan.to)}`, `Ayat ${p.plan.from}–${p.plan.to}`)}</p>
                </>
              ) : (
                <p className="mt-1 font-arabic-display text-2xl">{L('لم تختر وِردًا بعد', 'No portion chosen yet')}</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {p.plan ? L('تغيير', 'Change') : L('اختر', 'Choose')}
            </Button>
          </div>
          {hifz && (
            <>
              <Bar value={1 - hifz.remainingTotal / hifz.total} className="mt-5" />
              <p className="mt-2 text-sm text-muted">
                {hifz.done ? L('اكتمل هذا الورد. ما شاء الله!', 'This portion is complete. Masha’Allah!') : L(`${N(hifz.total - hifz.remainingTotal)} من ${N(hifz.total)} · ${daysLeft <= 1 ? 'يوم واحد تقريبًا' : daysLeft === 2 ? 'نحو يومين' : `نحو ${N(daysLeft)} ${daysLeft <= 10 ? 'أيام' : 'يومًا'}`} بهذا المعدّل`, `${hifz.total - hifz.remainingTotal} of ${hifz.total} · about ${daysLeft} days at this pace`)}
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <span>
              <span className="block font-medium">{L('الهدف اليومي', 'Daily goal')}</span>
              <span className="block text-xs text-muted">{L('اختر ما تستطيع الاستمرار عليه', 'Choose what you can sustain')}</span>
            </span>
            <Stepper
              value={p.plan?.dailyAyat ?? p.dailyAyat}
              min={1}
              max={20}
              onChange={(v) => updateActive((x) => ({ ...x, dailyAyat: v, plan: x.plan ? { ...x.plan, dailyAyat: v } : null }))}
              format={(n) => A(n)}
            />
          </div>
          {hifz && hifz.next.length > 0 && (
            <Button className="mt-5 w-full" href={`#/memorize?s=${hifz.s}&from=${hifz.next[0]}&to=${hifz.next[hifz.next.length - 1]}`}>
              <Icon name="play" size={16} fill />
              {L('ابدأ وِرد اليوم', 'Start today’s portion')}
            </Button>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted">{L('جدول المراجعة · ٧ أيام', 'Revision schedule · 7 days')}</p>
          <div className="mt-4 flex h-36 items-end gap-2" role="img" aria-label={L('عدد الآيات المستحقّة لكل يوم', 'Ayat due per day')}>
            {week.map((d, i) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs tabular-nums text-muted">{d.count ? N(d.count) : ''}</span>
                <div className={`w-full rounded-t-xl ${i === 0 ? 'bg-night' : 'bg-gold-soft'}`} style={{ height: `${Math.max(4, (d.count / peak) * 100)}px` }} />
                <span className={`text-[11px] ${i === 0 ? 'font-semibold' : 'text-muted'}`}>{i === 0 ? L('اليوم', 'Today') : dayName(d.date)}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            {L('كل آية تحفظها تعود بعد يوم، ثم ٣ أيام، ثم أسبوع، وتتباعد كلما ثبتت. ما تنساه يعود سريعًا.', 'Each new ayah returns after 1 day, then ~3, then ~7, spacing out as it settles. Anything forgotten comes back soon.')}
          </p>
        </Card>
      </div>

      <Section title={L('المراجعة المستحقّة', 'Due revision')} action={tasks.length > 0 && <Button size="sm" href="#/revise?due=1">{L('راجع الآن', 'Revise now')}</Button>}>
        {tasks.length === 0 ? (
          <Empty icon="check" title={L('لا شيء مستحقّ اليوم', 'Nothing due today')} body={L('أحسنت. ستظهر المواضع هنا عند حلول وقتها.', 'Well done. Portions appear here when they are due.')} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {overdue.length > 0 && (
              <Card className="p-4">
                <p className="mb-2 px-2 text-sm font-medium text-clay">{L('متأخرة', 'Overdue')}</p>
                <ul>
                  {overdue.map((t) => (
                    <TaskRow key={`${t.s}-${t.from}`} t={t} start />
                  ))}
                </ul>
              </Card>
            )}
            {dueToday.length > 0 && (
              <Card className="p-4">
                <p className="mb-2 px-2 text-sm font-medium">{L('اليوم', 'Today')}</p>
                <ul>
                  {dueToday.map((t) => (
                    <TaskRow key={`${t.s}-${t.from}`} t={t} start />
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </Section>

      <Section title={L('محفوظاتي', 'What I’ve memorised')} action={<Button size="sm" variant="outline" onClick={() => setKnown(true)}><Icon name="plus" size={16} />{L('أضف ما أحفظه', 'Add what I know')}</Button>}>
        {memorizedSurahs.length === 0 ? (
          <Empty icon="sprout" title={L('لم تُسجَّل محفوظات بعد', 'Nothing recorded yet')} body={L('إن كنت تحفظ سورًا من قبل فأضفها لتدخل جدول المراجعة.', 'If you already know some surahs, add them so they enter revision.')} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {memorizedSurahs.map((s) => {
              const m = memorizedCount(p, s.n)
              return (
                <a key={s.n} href={`#/surah/${s.n}`} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-line hover:ring-night/30">
                  <SurahBadge n={s.n} size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{lang === 'ar' ? s.ar : s.en}</span>
                    <Bar value={m / s.ayat} className="mt-1.5 h-1.5" />
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    {L(`${N(m)} من ${N(s.ayat)}`, `${m} of ${s.ayat}`)}
                  </span>
                </a>
              )
            })}
          </div>
        )}
      </Section>

      <PlanSheet open={editing} onClose={() => setEditing(false)} />
      <KnownSheet open={known} onClose={() => setKnown(false)} />
    </div>
  )
}

function PlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { L } = useL()
  const p = useActive()!
  const [r, setR] = useState<Range>(p.plan ? { s: p.plan.s, from: p.plan.from, to: p.plan.to } : { s: 114, from: 1, to: 6 })
  return (
    <Sheet open={open} onClose={onClose} title={L('اختر ورد الحفظ', 'Choose a portion to memorise')}>
      <RangePicker value={r} onChange={setR} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="rounded-full bg-night/5 px-3 py-1.5 text-xs" onClick={() => setR({ ...r, from: 1, to: surah(r.s).ayat })}>
          {L('السورة كاملة', 'Whole surah')}
        </button>
      </div>
      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          updateActive((x) => ({ ...x, plan: { s: r.s, from: r.from, to: r.to, dailyAyat: x.dailyAyat, startedAt: today() } }))
          onClose()
        }}
      >
        {L('اعتمد الخطة', 'Save plan')}
      </Button>
    </Sheet>
  )
}

function KnownSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { L } = useL()
  const [r, setR] = useState<Range>({ s: 1, from: 1, to: 7 })
  return (
    <Sheet open={open} onClose={onClose} title={L('أضف ما تحفظه مسبقًا', 'Add what you already know')}>
      <p className="mb-4 text-sm text-muted">{L('ستدخل هذه الآيات جدول المراجعة موزّعة على الأسبوع القادم.', 'These ayat will enter revision, spread over the coming week.')}</p>
      <RangePicker value={r} onChange={setR} />
      <button type="button" className="mt-3 rounded-full bg-night/5 px-3 py-1.5 text-xs" onClick={() => setR({ ...r, from: 1, to: surah(r.s).ayat })}>
        {L('السورة كاملة', 'Whole surah')}
      </button>
      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => {
          updateActive((x) => addKnown(x, r.s, r.from, r.to))
          onClose()
        }}
      >
        {L('أضف إلى محفوظاتي', 'Add to what I know')}
      </Button>
    </Sheet>
  )
}
