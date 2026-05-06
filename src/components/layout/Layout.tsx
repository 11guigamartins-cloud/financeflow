import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function Layout({ title, subtitle, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      {/* Sidebar — drawer no mobile, fixo no desktop */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>

      {/* Backdrop quando drawer aberto */}
      {open && (
        <div onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-surface-950/80 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen((o) => !o)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:bg-white/5">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-white truncate">{title}</h1>
              {subtitle && <p className="text-xs lg:text-sm text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
