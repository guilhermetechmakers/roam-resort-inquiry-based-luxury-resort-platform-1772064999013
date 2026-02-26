import type { FAQItem } from '@/types/about-help'

export const DEFAULT_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How does the inquiry process work?',
    answer:
      'Browse our curated destinations, select your preferred property, and submit an inquiry with your dates and preferences. Our concierge team will review your request and reach out within 24–48 hours to personalize your stay and provide availability and pricing.',
  },
  {
    id: 'faq-2',
    question: 'When do I pay for my stay?',
    answer:
      'Payment is requested after your inquiry is confirmed by our concierge team. You will receive a secure payment link to complete your booking. We accept major credit cards and bank transfers for qualifying stays.',
  },
  {
    id: 'faq-3',
    question: 'What are the cancellation and refund policies?',
    answer:
      'Cancellation policies vary by property and season. Your concierge will outline the specific terms when confirming your inquiry. Generally, we offer flexible options for changes and cancellations when communicated in advance.',
  },
  {
    id: 'faq-4',
    question: 'How do I contact the concierge team?',
    answer:
      'You can reach our concierge team through the contact form on this page, by email at concierge@roamresort.com, or through your inquiry thread once you have submitted a request. We aim to respond within 24 hours on business days.',
  },
  {
    id: 'faq-5',
    question: 'Do I need an account to submit an inquiry?',
    answer:
      'Yes. Creating a free account allows you to submit inquiries, track your requests, and manage your stay details. Sign up or log in to get started. Our team will guide you through each step of the process.',
  },
]

export const CONTACT_TOPICS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'booking', label: 'Booking & availability' },
  { value: 'payment', label: 'Payment & billing' },
  { value: 'cancellation', label: 'Cancellation or changes' },
  { value: 'technical', label: 'Technical support' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
] as const
