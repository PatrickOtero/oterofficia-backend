import { StudyInputBlock } from "./study.types";

const wordsPerMinute = 220;

const getBlockText = (block: StudyInputBlock) => {
  switch (block.type) {
    case "heading":
    case "paragraph":
    case "quote":
    case "callout":
      return `${block.data.text ?? ""} ${block.data.title ?? ""}`.trim();
    case "code":
      return String(block.data.code ?? "");
    case "image":
      return `${block.data.alt ?? ""} ${block.data.caption ?? ""}`.trim();
    case "list":
      return Array.isArray(block.data.items) ? block.data.items.join(" ") : "";
    case "references":
      return Array.isArray(block.data.links)
        ? block.data.links
            .map((link) => {
              if (!link || typeof link !== "object") {
                return "";
              }

              const currentLink = link as Record<string, unknown>;
              return `${currentLink.label ?? ""} ${currentLink.description ?? ""}`.trim();
            })
            .join(" ")
        : "";
    case "divider":
    default:
      return "";
  }
};

export const estimateReadingTime = (input: {
  excerpt: string;
  title: string;
  content: StudyInputBlock[];
}) => {
  const fullText = [input.title, input.excerpt, ...input.content.map(getBlockText)]
    .join(" ")
    .trim();

  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};
