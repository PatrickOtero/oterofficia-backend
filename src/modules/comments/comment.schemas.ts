import { readObject, readOptionalString, readRequiredString } from "../../core/utils/validation";

export const parseCommentPayload = (payload: unknown) => {
  const body = readObject(payload, "Os dados do comentário");

  return {
    content: readRequiredString(body.content, "O comentário", {
      max: 2000,
      preserveWhitespace: true,
    }),
  };
};

export const parseAdminCommentFilters = (payload: unknown) => {
  const query = readObject(payload ?? {}, "Os filtros dos comentários");

  return {
    postId: readOptionalString(query.postId, "O estudo", { max: 36 }),
    search: readOptionalString(query.search, "A busca", { max: 120 }),
  };
};
