import { randomUUID } from "crypto";
import { AppError } from "../../core/errors/AppError";
import {
  readObject,
  readOptionalString,
  readOptionalUrl,
  readRequiredString,
  readStringArray,
} from "../../core/utils/validation";
import { AboutBlockType, UpsertAboutPageInput } from "./about.types";

const ABOUT_BLOCK_TYPES = [
  "contact",
  "contact-form",
  "hero",
  "image",
  "social",
  "stack",
  "text",
] as const satisfies readonly AboutBlockType[];

const readOptionalInternalOrExternalUrl = (value: unknown, label: string) => {
  const normalized = readOptionalString(value, label, { max: 2048 });

  if (!normalized) {
    return undefined;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  return readOptionalUrl(normalized, label);
};

const readObjectArray = (value: unknown, label: string) => {
  if (!Array.isArray(value)) {
    throw new AppError(`${label} esta invalido.`, 400, "validation_error");
  }

  return value.map((item, index) => readObject(item, `${label} ${index + 1}`));
};

const parseHeroBlock = (value: unknown) => {
  const data = readObject(value, "Bloco hero");

  return {
    availability: readOptionalString(data.availability, "Disponibilidade", { max: 120 }),
    eyebrow: readOptionalString(data.eyebrow, "Eyebrow", { max: 40 }),
    highlights: readStringArray(data.highlights, "Highlights", { maxItemLength: 80, maxItems: 8 }),
    imageAlt: readOptionalString(data.imageAlt, "Texto alternativo da imagem", { max: 180 }),
    imageUrl: readOptionalUrl(data.imageUrl, "Imagem do hero"),
    location: readOptionalString(data.location, "Localizacao", { max: 120 }),
    primaryCtaLabel: readOptionalString(data.primaryCtaLabel, "Rótulo do CTA principal", { max: 40 }),
    primaryCtaUrl: readOptionalInternalOrExternalUrl(data.primaryCtaUrl, "URL do CTA principal"),
    secondaryCtaLabel: readOptionalString(data.secondaryCtaLabel, "Rótulo do CTA secundário", { max: 40 }),
    secondaryCtaUrl: readOptionalInternalOrExternalUrl(data.secondaryCtaUrl, "URL do CTA secundario"),
    subtitle: readOptionalString(data.subtitle, "Subtitulo", { max: 240 }),
    summary: readOptionalString(data.summary, "Resumo", { max: 4000, preserveWhitespace: true }),
    title: readRequiredString(data.title, "Título do hero", { max: 160 }),
  };
};

const parseTextBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de texto");
  const variant = readOptionalString(data.variant, "Variante", { max: 20 }) || "default";

  if (!["default", "spotlight"].includes(variant)) {
    throw new AppError("Variante do bloco de texto esta invalida.", 400, "validation_error");
  }

  return {
    body: readRequiredString(data.body, "Conteudo do texto", {
      max: 12000,
      preserveWhitespace: true,
    }),
    title: readOptionalString(data.title, "Título do texto", { max: 160 }),
    variant,
  };
};

const parseImageBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de imagem");
  const layout = readOptionalString(data.layout, "Layout da imagem", { max: 20 }) || "wide";

  if (!["banner", "portrait", "wide"].includes(layout)) {
    throw new AppError("Layout da imagem esta invalido.", 400, "validation_error");
  }

  return {
    alt: readOptionalString(data.alt, "Texto alternativo da imagem", { max: 180 }),
    caption: readOptionalString(data.caption, "Legenda da imagem", {
      max: 500,
      preserveWhitespace: true,
    }),
    layout,
    title: readOptionalString(data.title, "Título da imagem", { max: 140 }),
    url: readRequiredString(readOptionalUrl(data.url, "URL da imagem"), "URL da imagem", { max: 2048 }),
  };
};

const parseStackBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de stacks");
  const groups = readObjectArray(data.groups, "Grupos de stack").map((group) => ({
    items: readStringArray(group.items, "Itens do grupo", { maxItemLength: 60, maxItems: 18 }),
    title: readRequiredString(group.title, "Título do grupo", { max: 80 }),
  }));

  return {
    description: readOptionalString(data.description, "Descrição das stacks", {
      max: 1000,
      preserveWhitespace: true,
    }),
    groups,
    title: readOptionalString(data.title, "Título das stacks", { max: 140 }),
  };
};

const parseSocialBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de redes");
  const items = readObjectArray(data.items, "Itens sociais").map((item) => ({
    handle: readOptionalString(item.handle, "Handle social", { max: 120 }),
    iconUrl: readOptionalUrl(item.iconUrl, "Icone social"),
    label: readRequiredString(item.label, "Rótulo social", { max: 80 }),
    url: readRequiredString(readOptionalUrl(item.url, "URL social"), "URL social", { max: 2048 }),
  }));

  return {
    description: readOptionalString(data.description, "Descrição social", {
      max: 1000,
      preserveWhitespace: true,
    }),
    items,
    title: readOptionalString(data.title, "Título social", { max: 140 }),
  };
};

const parseContactBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de contato");
  const items = readObjectArray(data.items, "Itens de contato").map((item) => ({
    label: readRequiredString(item.label, "Rótulo de contato", { max: 80 }),
    note: readOptionalString(item.note, "Observacao de contato", {
      max: 240,
      preserveWhitespace: true,
    }),
    url: readOptionalInternalOrExternalUrl(item.url, "URL de contato"),
    value: readRequiredString(item.value, "Valor de contato", { max: 180 }),
  }));

  return {
    description: readOptionalString(data.description, "Descrição de contato", {
      max: 1000,
      preserveWhitespace: true,
    }),
    items,
    title: readOptionalString(data.title, "Título de contato", { max: 140 }),
  };
};

const parseContactFormBlock = (value: unknown) => {
  const data = readObject(value, "Bloco de formulario");

  return {
    description: readOptionalString(data.description, "Descrição do formulário", {
      max: 1200,
      preserveWhitespace: true,
    }),
    emailLabel: readOptionalString(data.emailLabel, "Rótulo do e-mail", { max: 60 }),
    messageLabel: readOptionalString(data.messageLabel, "Rótulo da mensagem", { max: 60 }),
    nameLabel: readOptionalString(data.nameLabel, "Rótulo do nome", { max: 60 }),
    subjectLabel: readOptionalString(data.subjectLabel, "Rótulo do assunto", { max: 60 }),
    submitLabel: readOptionalString(data.submitLabel, "Rótulo de envio", { max: 40 }),
    successMessage: readOptionalString(data.successMessage, "Mensagem de sucesso", {
      max: 140,
      preserveWhitespace: true,
    }),
    title: readOptionalString(data.title, "Título do formulário", { max: 140 }),
  };
};

const parseBlockData = (type: AboutBlockType, value: unknown) => {
  switch (type) {
    case "hero":
      return parseHeroBlock(value);
    case "text":
      return parseTextBlock(value);
    case "image":
      return parseImageBlock(value);
    case "stack":
      return parseStackBlock(value);
    case "social":
      return parseSocialBlock(value);
    case "contact":
      return parseContactBlock(value);
    case "contact-form":
      return parseContactFormBlock(value);
    default:
      throw new AppError("Tipo de bloco invalido.", 400, "validation_error");
  }
};

export const parseAboutPayload = (value: unknown): UpsertAboutPageInput => {
  const body = readObject(value, "Dados da página");

  if (!Array.isArray(body.blocks) || !body.blocks.length) {
    throw new AppError("A página precisa ter pelo menos um bloco.", 400, "validation_error");
  }

  return {
    blocks: body.blocks.map((block, index) => {
      const currentBlock = readObject(block, `Bloco ${index + 1}`);
      const type = readRequiredString(currentBlock.type, "Tipo do bloco") as AboutBlockType;

      if (!ABOUT_BLOCK_TYPES.includes(type)) {
        throw new AppError("Tipo de bloco invalido.", 400, "validation_error");
      }

      const id = readOptionalString(currentBlock.id, "Identificador do bloco", { max: 80 });

      return {
        data: parseBlockData(type, currentBlock.data),
        id: id || randomUUID(),
        type,
      };
    }),
    seoDescription: readOptionalString(body.seoDescription, "Descrição de SEO", {
      max: 500,
      preserveWhitespace: true,
    }) || null,
    seoTitle: readOptionalString(body.seoTitle, "Título de SEO", { max: 180 }) || null,
  };
};
