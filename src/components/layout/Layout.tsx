import { Sidebar } from './Sidebar'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function Layout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <Sidebar />
      <div className="pl-64">
        <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-md border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
