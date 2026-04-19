import {
  readEnum,
  readObject,
  readOptionalPositiveInteger,
  readOptionalString,
  readOptionalUrl,
  readRequiredString,
  readStringArray,
} from "../../core/utils/validation";
import { AppError } from "../../core/errors/AppError";
import {
  AdminStudyFilters,
  StudyBlockType,
  StudyInputBlock,
  StudyListFilters,
  StudyStatus,
  UpsertStudyInput,
} from "./study.types";

const BLOCK_TYPES: StudyBlockType[] = [
  "heading",
  "paragraph",
  "image",
  "code",
  "quote",
  "list",
  "divider",
  "callout",
  "references",
];

const normalizeNullishString = (value?: string) => value ?? null;

const parseHeadingBlock = (data: Record<string, unknown>) => ({
  level: readEnum(data.level, "O nível do heading", ["1", "2", "3", "4"] as const, "2"),
  text: readRequiredString(data.text, "O texto do heading", { max: 180 }),
});

const parseParagraphBlock = (data: Record<string, unknown>) => ({
  text: readRequiredString(data.text, "O texto do parágrafo", { max: 6000, preserveWhitespace: true }),
});

const parseImageBlock = (data: Record<string, unknown>) => ({
  alt: readOptionalString(data.alt, "O texto alternativo da imagem", { max: 180 }) ?? "",
  caption: readOptionalString(data.caption, "A legenda da imagem", { max: 240 }),
  url: readRequiredString(readOptionalUrl(data.url, "A imagem do bloco"), "A imagem do bloco"),
});

const parseCodeBlock = (data: Record<string, unknown>) => ({
  caption: readOptionalString(data.caption, "A legenda do código", { max: 160 }),
  code: readRequiredString(data.code, "O código do bloco", {
    max: 20000,
    min: 4,
    preserveWhitespace: true,
  }),
  language: readOptionalString(data.language, "A linguagem do código", { max: 40 }) ?? "text",
});

const parseQuoteBlock = (data: Record<string, unknown>) => ({
  author: readOptionalString(data.author, "O autor da citação", { max: 120 }),
  text: readRequiredString(data.text, "O texto da citação", { max: 1600, preserveWhitespace: true }),
});

const parseListBlock = (data: Record<string, unknown>) => {
  const items = readStringArray(data.items, "Os itens da lista", { maxItemLength: 240, maxItems: 30 });

  if (!items.length) {
    throw new AppError("A lista precisa ter pelo menos um item.", 400, "validation_error");
  }

  return {
    items,
    style: readEnum(data.style, "O estilo da lista", ["ordered", "unordered"] as const, "unordered"),
  };
};

const parseDividerBlock = (data: Record<string, unknown>) => ({
  spacing: readEnum(data.spacing, "O espaçamento do divisor", ["sm", "md", "lg"] as const, "md"),
});

const parseCalloutBlock = (data: Record<string, unknown>) => ({
  text: readRequiredString(data.text, "O conteúdo do destaque", {
    max: 2400,
    preserveWhitespace: true,
  }),
  title: readOptionalString(data.title, "O título do destaque", { max: 120 }),
  variant: readEnum(data.variant, "A variação do destaque", ["info", "note", "success", "warning"] as const, "note"),
});

const parseReferencesBlock = (data: Record<string, unknown>) => {
  if (!Array.isArray(data.links)) {
    throw new AppError("As referências estão inválidas.", 400, "validation_error");
  }

  const links = data.links.map((item, index) => {
    const link = readObject(item, `A referência ${index + 1}`);

    return {
      description: readOptionalString(link.description, "A descrição da referência", { max: 180 }),
      label: readRequiredString(link.label, "O rótulo da referência", { max: 80 }),
      url: readRequiredString(readOptionalUrl(link.url, "A URL da referência"), "A URL da referência"),
    };
  });

  if (!links.length) {
    throw new AppError("Adicione pelo menos uma referência.", 400, "validation_error");
  }

  return { links };
};

const parseStudyBlock = (value: unknown, index: number): StudyInputBlock => {
  const block = readObject(value, `O bloco ${index + 1}`);
  const type = readEnum(block.type, "O tipo do bloco", BLOCK_TYPES);
  const data = readObject(block.data, `O conteúdo do bloco ${index + 1}`);

  switch (type) {
    case "heading":
      return { data: parseHeadingBlock(data), type };
    case "paragraph":
      return { data: parseParagraphBlock(data), type };
    case "image":
      return { data: parseImageBlock(data), type };
    case "code":
      return { data: parseCodeBlock(data), type };
    case "quote":
      return { data: parseQuoteBlock(data), type };
    case "list":
      return { data: parseListBlock(data), type };
    case "divider":
      return { data: parseDividerBlock(data), type };
    case "callout":
      return { data: parseCalloutBlock(data), type };
    case "references":
      return { data: parseReferencesBlock(data), type };
    default:
      throw new AppError("O tipo de bloco informado não é suportado.", 400, "validation_error");
  }
};

const parseStudyBlocks = (value: unknown) => {
  if (!Array.isArray(value)) {
    throw new AppError("O conteúdo da postagem está inválido.", 400, "validation_error");
  }

  if (!value.length) {
    throw new AppError("Adicione pelo menos um bloco ao estudo.", 400, "validation_error");
  }

  return value.map(parseStudyBlock);
};

export const parseStudyPayload = (payload: unknown): UpsertStudyInput => {
  const body = readObject(payload, "Os dados do estudo");

  return {
    category: readRequiredString(body.category, "A categoria", { max: 120 }),
    content: parseStudyBlocks(body.content ?? body.blocks),
    coverImage: normalizeNullishString(readOptionalUrl(body.coverImage, "A imagem de capa")),
    excerpt: readRequiredString(body.excerpt, "O resumo", { max: 360 }),
    readingTime: readOptionalPositiveInteger(body.readingTime, "O tempo de leitura"),
    seoDescription: normalizeNullishString(
      readOptionalString(body.seoDescription, "A descrição de SEO", { max: 220 })
    ),
    seoTitle: normalizeNullishString(readOptionalString(body.seoTitle, "O título de SEO", { max: 180 })),
    slug: readOptionalString(body.slug, "O slug", { max: 190 }),
    status: readEnum(body.status, "O status", ["draft", "published"] as const, "draft"),
    tags: readStringArray(body.tags, "As tags", { maxItemLength: 32, maxItems: 12 }),
    title: readRequiredString(body.title, "O título", { max: 180 }),
  };
};

const parseStudyFiltersBase = (query: Record<string, unknown>): StudyListFilters => ({
  category: readOptionalString(query.category, "A categoria", { max: 120 }),
  search: readOptionalString(query.search, "A busca", { max: 160 }),
  tag: readOptionalString(query.tag, "A tag", { max: 32 }),
});

export const parsePublicStudyFilters = (query: unknown): StudyListFilters =>
  parseStudyFiltersBase(readObject(query ?? {}, "Os filtros"));

export const parseAdminStudyFilters = (query: unknown): AdminStudyFilters => {
  const normalizedQuery = readObject(query ?? {}, "Os filtros");

  return {
    ...parseStudyFiltersBase(normalizedQuery),
    status: readEnum(normalizedQuery.status, "O status", ["all", "draft", "published"] as const, "all"),
  };
};

export const parseStatusPayload = (payload: unknown): StudyStatus => {
  const body = readObject(payload, "Os dados de status");

  return readEnum(body.status, "O status", ["draft", "published"] as const);
};
