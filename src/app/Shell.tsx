import { useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/ui'
import { useL } from '../lib/i18n'
import { navigate } from '../lib/router'
import { setState, useActive, useStore } from '../lib/store'

type NavItem = { to: string; route: string; icon: string; ar: string; en: string }

const ADULT: NavItem[] = [
  { to: '/', route: '', icon: 'home', ar: 'الرئيسية', en: 'Home' },
  { to: '/quran', route: 'quran', icon: 'book', ar: 'المصحف', en: 'Quran' },
  { to: '/plan', route: 'plan', icon: 'sprout', ar: 'الحفظ', en: 'Hifz' },
  { to: '/recite', route: 'recite', icon: 'mic', ar: 'التسميع', en: 'Recite' },
  { to: '/journey', route: 'journey', icon: 'path', ar: 'رحلتي', en: 'Journey' },
]
const KIDS: NavItem[] = [
  { to: '/', route: '', icon: 'home', ar: 'بيتي', en: 'Home' },
  { to: '/kids/letters', route: 'kids', icon: 'letters', ar: 'الحروف', en: 'Letters' },
  { to: '/kids/surahs', route: 'kids-surahs', icon: 'book', ar: 'سوري', en: 'My surahs' },
  { to: '/recite', route: 'recite', icon: 'mic', ar: 'أسمِع', en: 'Recite' },
  { to: '/journey', route: 'journey', icon: 'star', ar: 'نجومي', en: 'My stars' },
]
const GUIDE: NavItem[] = [
  { to: '/', route: '', icon: 'users', ar: 'المتعلّمون', en: 'Learners' },
  { to: '/quran', route: 'quran', icon: 'book', ar: 'المصحف', en: 'Quran' },
  { to: '/settings', route: 'settings', icon: 'settings', ar: 'الإعدادات', en: 'Settings' },
]

export function Shell({ children, focus, route }: { children: ReactNode; focus: boolean; route: string }) {
  const { L } = useL()
  const mode = useStore((s) => s.mode)
  const active = useActive()
  const [switcher, setSwitcher] = useState(false)
  const items = mode === 'guide' ? GUIDE : active?.path === 'kids' ? KIDS : ADULT
  const current = route === 'kids' && location.hash.includes('surahs') ? 'kids-surahs' : route === 'surah' ? 'quran' : route === 'learner' || route === 'review' ? '' : route

  if (focus) return <div className="min-h-[100dvh] bg-parchment text-night">{children}</div>

  return (
    <div className="min-h-[100dvh] bg-parchment text-night md:flex">
      {/* Desktop side rail */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-e border-line bg-card/60 px-4 py-6 md:flex">
        <a href="#/" className="mb-8 block px-3">
          <Logo />
        </a>
        <nav className="flex flex-1 flex-col gap-1" aria-label={L('التنقل الرئيسي', 'Main navigation')}>
          {items.map((it) => (
            <a
              key={it.to}
              href={`#${it.to}`}
              aria-current={current === it.route ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] transition ${current === it.route ? 'bg-night text-parchment' : 'text-night/75 hover:bg-night/5'}`}
            >
              <Icon name={it.icon} />
              {L(it.ar, it.en)}
            </a>
          ))}
        </nav>
        <button type="button" onClick={() => setSwitcher(true)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-start hover:bg-night/5">
          <Avatar name={mode === 'guide' ? L('مشرف', 'Guide') : (active?.name ?? '')} kid={active?.path === 'kids' && mode !== 'guide'} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{mode === 'guide' ? L('ولي الأمر / المعلّم', 'Parent / teacher') : active?.name}</span>
            <span className="block text-xs text-muted">{L('تبديل الملف', 'Switch profile')}</span>
          </span>
        </button>
        {mode !== 'guide' && (
          <a href="#/settings" className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted hover:bg-night/5">
            <Icon name="settings" size={20} />
            {L('الإعدادات', 'Settings')}
          </a>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line/70 bg-parchment/90 px-5 py-3 backdrop-blur md:hidden">
          <a href="#/">
            <Logo compact />
          </a>
          <div className="flex items-center gap-1">
            {mode !== 'guide' && (
              <a href="#/settings" aria-label={L('الإعدادات', 'Settings')} className="flex h-10 w-10 items-center justify-center rounded-full text-night/70 hover:bg-night/5">
                <Icon name="settings" size={20} />
              </a>
            )}
            <button type="button" onClick={() => setSwitcher(true)} aria-label={L('تبديل الملف', 'Switch profile')}>
              <Avatar name={mode === 'guide' ? L('مشرف', 'Guide') : (active?.name ?? '')} kid={active?.path === 'kids' && mode !== 'guide'} />
            </button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-5xl px-5 pb-32 pt-6 md:px-10 md:pb-16 md:pt-10">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label={L('التنقل الرئيسي', 'Main navigation')}>
        <div className="mx-auto flex max-w-lg">
          {items.map((it) => {
            const on = current === it.route
            return (
              <a key={it.to} href={`#${it.to}`} aria-current={on ? 'page' : undefined} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${on ? 'text-night' : 'text-night/50'}`}>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${on ? 'bg-gold-soft/70' : ''}`}>
                  <Icon name={it.icon} size={21} />
                </span>
                {L(it.ar, it.en)}
              </a>
            )
          })}
        </div>
      </nav>

      <ProfileSwitcher open={switcher} onClose={() => setSwitcher(false)} />
    </div>
  )
}

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className={`${compact ? 'h-8 w-8' : 'h-10 w-10'} ${light ? 'text-gold-soft' : 'text-gold'}`} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="9" y="9" width="22" height="22" rx="4" />
        <rect x="9" y="9" width="22" height="22" rx="4" transform="rotate(45 20 20)" />
        <path d="M14 23c2-1.6 4-2 6-2s4 .4 6 2M20 21v-6" />
      </svg>
      <span className="leading-none">
        <span dir="rtl" className={`block font-arabic-display ${compact ? 'text-xl' : 'text-2xl'} font-bold ${light ? 'text-parchment' : 'text-night'}`}>
          القرآن رفيقي
        </span>
        {!compact && <span className={`mt-1 block text-[11px] tracking-[0.18em] ${light ? 'text-parchment/60' : 'text-muted'}`}>AL-QURAN RAFIQI</span>}
      </span>
    </span>
  )
}

export function Avatar({ name, kid = false, size = 40 }: { name: string; kid?: boolean; size?: number }) {
  const ch = [...(name.trim() || '؟')][0]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${kid ? 'bg-sky/15 text-sky' : 'bg-gold-soft text-night'}`} style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {ch}
    </span>
  )
}

function ProfileSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { L } = useL()
  const profiles = useStore((s) => s.profiles)
  const activeId = useStore((s) => s.activeId)
  const mode = useStore((s) => s.mode)
  const pick = (id: string) => {
    setState((s) => ({ ...s, activeId: id, mode: 'learner' }))
    onClose()
    navigate('/')
  }
  return (
    <Sheet open={open} onClose={onClose} title={L('من يتعلّم الآن؟', 'Who is learning now?')}>
      <div className="space-y-2">
        {profiles.map((p) => (
          <button key={p.id} type="button" onClick={() => pick(p.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 ${mode === 'learner' && p.id === activeId ? 'bg-card ring-night' : 'bg-card/60 ring-line hover:ring-night/30'}`}>
            <Avatar name={p.name} kid={p.path === 'kids'} />
            <span className="flex-1">
              <span className="block font-medium">{p.name}</span>
              <span className="block text-xs text-muted">{p.path === 'kids' ? L('مسار تعلّم القراءة', 'Learning to read') : p.path === 'reading' ? L('مسار التلاوة', 'Reading path') : L('مسار الحفظ', 'Memorisation path')}</span>
            </span>
            {mode === 'learner' && p.id === activeId && <Icon name="check" className="text-leaf" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setState((s) => ({ ...s, mode: 'guide' }))
            onClose()
            navigate('/')
          }}
          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-start ring-1 ${mode === 'guide' ? 'bg-card ring-night' : 'bg-card/60 ring-line hover:ring-night/30'}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night text-parchment">
            <Icon name="users" size={20} />
          </span>
          <span className="flex-1">
            <span className="block font-medium">{L('ولي الأمر / المعلّم', 'Parent / teacher')}</span>
            <span className="block text-xs text-muted">{L('متابعة المتعلّمين والتكليفات والتسميع', 'Learners, assignments, recitation reviews')}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            onClose()
            navigate('/settings?add=1')
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-3 text-sm text-muted hover:text-night"
        >
          <Icon name="plus" size={18} />
          {L('إضافة متعلّم', 'Add a learner')}
        </button>
      </div>
    </Sheet>
  )
}
