import "./faq-section.css";

type Faq = { id: string; question: string; answer: string };

// Splits on bare URLs so answers can link out (e.g. to a donation page)
// without needing a rich-text editor in the admin -- admins just paste the
// URL directly into the answer text. Capturing group keeps the URL itself
// in the split output, at every odd index.
const URL_PATTERN = /(https?:\/\/\S+)/g;

function renderAnswer(answer: string) {
  return answer.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a key={index} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

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
          <p>{renderAnswer(faq.answer)}</p>
        </details>
      ))}
    </div>
  );
}
