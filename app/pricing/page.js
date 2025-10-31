import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PricingPage(){
  return (
    <div className="container mx-auto py-12 space-y-8">
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="relative">
          <CardHeader><CardTitle>Free</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5">
              <li>Basic profile</li>
              <li>Visible in directory</li>
            </ul>
            <Button className="w-full" variant="secondary">Current</Button>
          </CardContent>
        </Card>
        <Card className="relative border-primary/40">
          <CardHeader><CardTitle>Pro</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5">
              <li>Priority listing</li>
              <li>More links & analytics</li>
            </ul>
            <Button className="w-full">Upgrade (Admin toggles)</Button>
          </CardContent>
        </Card>
        <Card className="relative border-amber-500/40">
          <CardHeader><CardTitle>Boost</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="list-disc pl-5">
              <li>Top of directory</li>
              <li>7 days per boost</li>
            </ul>
            <Button className="w-full">Boost (Admin sets)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
