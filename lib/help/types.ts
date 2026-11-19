export type Block =
  | readonly ["h", string]
  | readonly ["p", string]
  | readonly ["ul", readonly string[]]
  | readonly ["ol", readonly string[]]
  | readonly ["note", string]
  | readonly ["callout", "tip" | "warning" | "info", string]
  | readonly ["table", readonly string[], readonly (readonly string[])[]]
  | readonly ["img", string, string, string?]
  | readonly ["faq", readonly (readonly [string, string])[]];

export type HelpCategory = { slug: string; name: string; icon: string; description: string };

export type HelpArticle = {
  category: string;
  slug: string;
  title: string;
  description: string;
  keywords: readonly string[];
  body: readonly Block[];
  /** "category/slug" ids */
  related: readonly string[];
  cta?: { label: string; href: string };
  /** Only for articles whose content changed after HELP_UPDATED. */
  updated?: string;
};
