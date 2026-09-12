import React from 'react';

interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
}

export default function HighlightText({ text, query = '', className = '' }: HighlightTextProps) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Split query into keywords (min 1 char)
  const keywords = query
    .trim()
    .split(/\s+/)
    .filter((k) => k.length > 0)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (keywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-400/30 text-amber-200 font-bold px-0.5 py-0.2 rounded"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}
