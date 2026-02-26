/**
 * SupportCTASection - Contact concierge or support if payment doesn't complete.
 */

import { Link } from 'react-router-dom'
import { Mail, HelpCircle, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function SupportCTASection() {
  return (
    <Card className="rounded-xl border-border/80 bg-card/50 shadow-card">
      <CardHeader>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Need Help?
        </h2>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <p className="text-sm text-muted-foreground">
          If you experience any issues with payment, our concierge team is here to assist.
        </p>
        <ul className="space-y-3" role="list">
          <li>
            <a
              href="mailto:concierge@roamresort.com"
              className="inline-flex items-center gap-2 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="Email concierge"
            >
              <Mail className="h-4 w-4 shrink-0" />
              concierge@roamresort.com
            </a>
          </li>
          <li>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="Contact support"
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              Contact Support
            </Link>
          </li>
          <li>
            <Link
              to="/help"
              className="inline-flex items-center gap-2 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="Help center"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Help Center
            </Link>
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
