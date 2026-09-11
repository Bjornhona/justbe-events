// Holding page for b-events.es. Ships ~12 days, then delete this directory and
// the `coming-soon` entry in proxy.ts. Deliberately not reusable.
import Logo from '@/components/Logo'

export default function ComingSoonPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper px-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <Logo className="w-[280px] max-w-full text-ink-body" />
        <div className="space-y-1 text-sm text-ink-muted">
          <p>Nueva web en camino.</p>
          <p lang="en">New website on its way.</p>
        </div>
        <a
          href="mailto:events@b-events.es"
          className="text-sm text-jb-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-jb-700"
        >
          events@b-events.es
        </a>
      </div>
      <p className="pb-8 text-center text-xs text-ink-muted">
        Barbara Juan Portoles Events SL · B93941276
      </p>
    </main>
  )
}
