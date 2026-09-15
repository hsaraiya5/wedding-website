import "./faq-section.css";

type Faq = { id: string; question: string; answer: string };

// Ported from the handoff's ".faq-list" -- native <details>/<summary>
// gives free keyboard/AT support for an accordion, so no client JS or
// open-state tracking is needed.
export function FaqSection({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <div className="fq-list">
      {faqs.map((faq, index) => (
        <details key={faq.id} open={index === 0}>
          <summary className="font-heading">{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}
