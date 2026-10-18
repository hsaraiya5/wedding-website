import "./faq-section.css";

type Faq = { id: string; question: string; answer: string };

// Answers can link out without needing a rich-text editor in the admin.
// Two forms: Markdown-style [link text](https://...) shows just the text,
// for long URLs like Google Maps directions, and a bare https://... URL
// pasted straight into the answer still links as itself.
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/\S+)/g;

function renderAnswer(answer: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of answer.matchAll(LINK_PATTERN)) {
    const [whole, text, markdownUrl, bareUrl] = match;
    parts.push(answer.slice(lastIndex, match.index));
    const href = markdownUrl ?? bareUrl;
    parts.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer">
        {text ?? bareUrl}
      </a>
    );
    lastIndex = match.index + whole.length;
  }
  parts.push(answer.slice(lastIndex));
  return parts;
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
