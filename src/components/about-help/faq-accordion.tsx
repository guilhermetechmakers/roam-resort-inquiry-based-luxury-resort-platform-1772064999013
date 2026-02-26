import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import type { FAQItem } from '@/types/about-help'

export interface FAQAccordionProps {
  faqs?: FAQItem[] | null
  allowMultiple?: boolean
  className?: string
}

export function FAQAccordion({
  faqs,
  allowMultiple = false,
  className,
}: FAQAccordionProps) {
  const faqItems = Array.isArray(faqs) ? faqs : []

  return (
    <section
      className={cn('py-16 sm:py-20', className)}
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          id="faq-heading"
          className="font-serif text-3xl font-semibold text-foreground sm:text-4xl"
        >
          Frequently Asked Questions
        </h2>
        <p className="mt-4 text-muted-foreground">
          Find answers to common questions about inquiries, payments, and our
          host policies.
        </p>
        <Accordion
          type={allowMultiple ? 'multiple' : 'single'}
          collapsible={allowMultiple}
          className="mt-10"
        >
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-border"
            >
              <AccordionTrigger
                className="font-medium text-foreground hover:text-accent hover:no-underline py-5 text-left"
                aria-expanded={undefined}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
