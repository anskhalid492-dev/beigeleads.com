// Long-form article text for published benchmarks (CLAUDE.md section 138). Markdown-lite: paragraphs, "### " h3, "- " lists, "1. " lists, **bold**, [text](href).
// Rule: a number appears only if the source states it. Guidance that is not from the source must say so in the text.
export type Section = { id: string; heading: string; body: string };
export type Long = { sections: Section[]; faq: { q: string; a: string }[] };
