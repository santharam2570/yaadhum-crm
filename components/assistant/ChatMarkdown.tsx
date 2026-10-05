import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const INLINE = /(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g;

function inline(text: string, onNavigate?: () => void): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const anchor = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (anchor) {
      const [, label, href] = anchor;
      if (href.startsWith("/")) {
        return (
          <Link key={i} href={href} onClick={onNavigate} className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800">
            {label}
          </Link>
        );
      }
      if (/^https?:\/\//.test(href)) {
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline underline-offset-2">
            {label}
          </a>
        );
      }
      return <Fragment key={i}>{label}</Fragment>;
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="font-semibold text-ink-900">{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={i} className="rounded bg-cream-100 px-1 text-[0.85em]">{part.slice(1, -1)}</code>;
    if (/^_[^_]+_$/.test(part)) return <em key={i} className="text-ink-600">{inline(part.slice(1, -1), onNavigate)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Renders the small markdown subset the assistant produces (bold, links, bullets). */
export function ChatMarkdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-4 marker:text-brand-400">
        {list.map((item, i) => (
          <li key={i}>{inline(item, onNavigate)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      list.push(bullet[1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      <p key={`p${blocks.length}`} className={heading ? "mt-1 font-semibold text-ink-900" : ""}>
        {inline(heading ? heading[1] : line, onNavigate)}
      </p>,
    );
  }
  flush();
  return <div className="space-y-1.5 break-words">{blocks}</div>;
}
