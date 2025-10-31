import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Discover proven traders. Decide with transparency.</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">4Profit is a marketplace directory where investors find traders via clear profiles, filters and reputation. No brokerage integrations. No custody. No investment advice.</p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/traders">Browse Traders</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/submit">Add Trader</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>1. Explore</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Use filters by assets, style, languages, experience and more.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>2. Request contact</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Investors have 3 free contact credits per month. Traders accept or decline.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>3. Decide</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">If accepted, contact details are unmasked for 7 days to continue the conversation.</CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center">
        <Button asChild variant="secondary">
          <Link href="/traders">Start browsing</Link>
        </Button>
      </section>
    </div>
  )
}
