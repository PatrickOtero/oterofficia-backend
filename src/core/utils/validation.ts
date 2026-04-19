import { AppError } from "../errors/AppError";

type StringOptions = {
  max?: number;
  min?: number;
  preserveWhitespace?: boolean;
};

export const readObject = (value: unknown, label: string) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(`${label} está inválido.`, 400, "validation_error");
  }

  return value as Record<string, unknown>;
};

export const readRequiredString = (value: unknown, label: string, options: StringOptions = {}) => {
  const { max, min = 1, preserveWhitespace = false } = options;

  if (typeof value !== "string") {
    throw new AppError(`${label} é obrigatório.`, 400, "validation_error");
  }

  const normalized = preserveWhitespace ? value.replace(/\r\n/g, "\n") : value.trim();

  if (normalized.trim().length < min) {
    throw new AppError(`${label} é obrigatório.`, 400, "validation_error");
  }

  if (max && normalized.length > max) {
    throw new AppError(`${label} ultrapassa o limite permitido.`, 400, "validation_error");
  }

  return normalized;
};

export const readOptionalString = (value: unknown, label: string, options: StringOptions = {}) => {
  const { max, preserveWhitespace = false } = options;

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(`${label} está inválido.`, 400, "validation_error");
  }

  const normalized = preserveWhitespace ? value.replace(/\r\n/g, "\n") : value.trim();

  if (!normalized.trim().length) {
    return undefined;
  }

  if (max && normalized.length > max) {
    throw new AppError(`${label} ultrapassa o limite permitido.`, 400, "validation_error");
  }

  return normalized;
};

export const readOptionalUrl = (value: unknown, label: string) => {
  const normalized = readOptionalString(value, label, { max: 2048 });

  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).toString();
  } catch (_error) {
    throw new AppError(`${label} precisa ser uma URL válida.`, 400, "validation_error");
  }
};

export const readStringArray = (
  value: unknown,
  label: string,
  options: { maxItemLength?: number; maxItems?: number } = {}
) => {
  const { maxItemLength = 40, maxItems = 12 } = options;

  if (value === undefined || value === null) {
    return [] as string[];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`${label} está inválido.`, 400, "validation_error");
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length !== value.length) {
    throw new AppError(`${label} contém itens inválidos.`, 400, "validation_error");
  }

  if (normalized.length > maxItems) {
    throw new AppError(`${label} ultrapassa o limite permitido.`, 400, "validation_error");
  }

  const deduplicated = Array.from(new Set(normalized));

  deduplicated.forEach((item) => {
    if (item.length > maxItemLength) {
      throw new AppError(`${label} contém itens muito longos.`, 400, "validation_error");
    }
  });

  return deduplicated;
};

export const readEnum = <T extends string>(
  value: unknown,
  label: string,
  acceptedValues: readonly T[],
  fallback?: T
) => {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) {
      return fallback;
    }

    throw new AppError(`${label} é obrigatório.`, 400, "validation_error");
  }

  if (typeof value !== "string" || !acceptedValues.includes(value as T)) {
    throw new AppError(`${label} está inválido.`, 400, "validation_error");
  }

  return value as T;
};

export const readOptionalPositiveInteger = (value: unknown, label: string) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${label} está inválido.`, 400, "validation_error");
  }

  return parsed;
};
