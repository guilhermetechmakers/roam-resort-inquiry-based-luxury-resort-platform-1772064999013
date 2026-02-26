import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CheckoutPage() {
  const [params] = useSearchParams()
  const status = params.get('status') ?? 'success'

  const isSuccess = status === 'success'

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {isSuccess ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mt-6 font-serif text-3xl font-bold">Payment Complete</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you. Your payment has been processed successfully.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="mt-6 font-serif text-3xl font-bold">Payment Failed</h1>
            <p className="mt-2 text-muted-foreground">
              Something went wrong. Please try again or contact support.
            </p>
          </>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link to="/profile">
            <Button>View My Inquiries</Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
