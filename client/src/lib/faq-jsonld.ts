export interface FaqItem {
  question: string;
  answer: string;
}

/** schema.org FAQPage built from the same question/answer data the FAQ page renders. */
export function buildFaqJsonLd(categories: { questions: FaqItem[] }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: categories.flatMap((category) =>
      category.questions.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      }))
    ),
  };
}

/** JSON for a <script type="application/ld+json"> tag; "<" is escaped so the text can't close the tag. */
export function jsonLdScriptContent(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
