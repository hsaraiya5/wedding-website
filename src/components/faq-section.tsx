import { Fragment } from "react";
import "./faq-section.css";

type Faq = { id: string; question: string; answer: string };

// Answers can link out without needing a rich-text editor in the admin.
// Two forms: Markdown-style [link text](https://...) shows just the text,
// for long URLs like Google Maps directions, and a bare https://... URL
// pasted straight into the answer still links as itself.
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/\S+)/g;

function renderLinks(text: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [whole, linkText, markdownUrl, bareUrl] = match;
    parts.push(text.slice(lastIndex, match.index));
    const href = markdownUrl ?? bareUrl;
    parts.push(
      <a key={match.index} href={href} target="_blank" rel="noopener noreferrer">
        {linkText ?? bareUrl}
      </a>
    );
    lastIndex = match.index + whole.length;
  }
  parts.push(text.slice(lastIndex));
  return parts;
}

// Same no-editor approach for structure: a line starting with "- " (or "* ")
// is a bullet, consecutive bullets form one list, a line break inside a
// paragraph is kept, and a blank line starts a new paragraph.
const BULLET_PATTERN = /^\s*[-*•]\s+/;

type Block = { kind: "paragraph"; lines: string[] } | { kind: "list"; items: string[] };

// Also renders the hotel cards' parking notes, which use the same format.
export function renderAnswer(answer: string) {
  const blocks: Block[] = [];
  for (const rawLine of answer.split(/\r?\n/)) {
    const line = rawLine.trim();
    const last = blocks[blocks.length - 1];
    if (!line) {
      // Blank line closes whatever block is open.
      if (last) blocks.push({ kind: "paragraph", lines: [] });
      continue;
    }
    if (BULLET_PATTERN.test(line)) {
      const item = line.replace(BULLET_PATTERN, "");
      if (last?.kind === "list") last.items.push(item);
      else blocks.push({ kind: "list", items: [item] });
    } else if (last?.kind === "paragraph") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "paragraph", lines: [line] });
    }
  }

  return blocks.map((block, index) => {
    if (block.kind === "list") {
      return (
        <ul key={index}>
          {block.items.map((item, i) => (
            <li key={i}>{renderLinks(item)}</li>
          ))}
        </ul>
      );
    }
    if (block.lines.length === 0) return null;
    return (
      <p key={index}>
        {block.lines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 ? <br /> : null}
            {renderLinks(line)}
          </Fragment>
        ))}
      </p>
    );
  });
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
          <div className="fq-answer">{renderAnswer(faq.answer)}</div>
        </details>
      ))}
    </div>
  );
}
