'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [];

export const FAQ = () => (
  <div className="divide-y sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
    <div className="space-y-2 p-4 sm:p-8">
      <h2 className="font-semibold text-2xl tracking-tight">FAQ</h2>
      <p className="text-muted-foreground">
        Common questions about Streamdown and how it works with AI-powered
        streaming applications.
      </p>
    </div>
    <div className="p-4 sm:col-span-2 sm:p-8">
      <Accordion className="w-full" collapsible type="single">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </div>
);
