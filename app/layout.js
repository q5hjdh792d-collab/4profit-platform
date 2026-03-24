import './globals.css'
import { Inter_Tight } from 'next/font/google'
import Link from 'next/link'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import RoleChip from '@/app/partials/RoleChip'

const inter = Inter_Tight({ subsets: ['latin'] })

export const metadata = {
  title: '4BASE — by ALVO13',
  description: '4BASE.PRO — elite trader discovery, by ALVO13'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen text-slate-900`}>
        <div className="min-h-screen flex flex-col" style={{background:"radial-gradient(circle at 50% 30%, #F8FAFC 0%, #E5EAF0 40%, #CBD5E1 100%)"}}>
          <header className="border-b border-slate-400/40 sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/40">
            <div className="container mx-auto flex items-center justify-between py-3">
              <Link href="/" className="font-black text-2xl md:text-3xl flex items-center gap-2">
                <span className="tracking-tighter">4BASE</span>
                <span className="text-xs text-slate-600 border-l pl-2">by ALVO13</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/traders" className="hover:underline">Traders</Link>
                <Link href="/favorites" className="hover:underline">Favorites</Link>
                <Link href="/pricing" className="hover:underline">Pricing</Link>
                <Link href="/auth" className="hover:underline">Login</Link>
                <RoleChip />
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-slate-400/40 py-8 mt-12">
            <div className="container mx-auto text-sm flex flex-wrap gap-4 items-center justify-between">
              <p className="text-slate-600">© {new Date().getFullYear()} 4BASE • by ALVO13</p>
              <div className="flex gap-4">
                <Link href="/legal/terms" className="hover:underline">Terms</Link>
                <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
                <Link href="/legal/cookies" className="hover:underline">Cookies</Link>
                <Link href="/legal/disclaimer" className="hover:underline">Disclaimer</Link>
              </div>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
