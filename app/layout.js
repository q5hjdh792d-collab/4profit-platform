import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import Disclaimer from '@/app/partials/Disclaimer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '4Profit — Find Traders, Transparently',
  description: 'Marketplace directory where investors discover traders via transparent profiles and filters.'
}

export default function RootLayout({ children }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <div className="min-h-screen flex flex-col">
              <header className="border-b border-border sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="container mx-auto flex items-center justify-between py-3">
                  <Link href="/" className="font-semibold text-lg">4Profit</Link>
                  <nav className="flex items-center gap-4 text-sm">
                    <Link href="/traders" className="hover:underline">Traders</Link>
                    <Link href="/favorites" className="hover:underline">Favorites</Link>
                    <Link href="/pricing" className="hover:underline">Pricing</Link>
                    <Link href="/auth" className="hover:underline">Login</Link>
                  <RoleChip />
                  </nav>
                </div>
              </header>

              <Disclaimer />

              <main className="flex-1">{children}</main>

              <footer className="border-t border-border py-8 mt-12">
                <div className="container mx-auto text-sm flex flex-wrap gap-4 items-center justify-between">
                  <p className="text-muted-foreground">© {new Date().getFullYear()} 4Profit</p>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
