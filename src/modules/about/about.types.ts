export type AboutBlockType =
  | "contact"
  | "contact-form"
  | "hero"
  | "image"
  | "social"
  | "stack"
  | "text";

export type AboutBlockData = Record<string, unknown>;

export type AboutInputBlock = {
  data: AboutBlockData;
  id?: string;
  type: AboutBlockType;
};

export type AboutBlock = {
  data: AboutBlockData;
  id: string;
  type: AboutBlockType;
};

export type AboutPage = {
  blocks: AboutBlock[];
  createdAt: string;
  id: string;
  seoDescription: string | null;
  seoTitle: string | null;
  updatedAt: string;
};

export type UpsertAboutPageInput = {
  blocks: AboutInputBlock[];
  seoDescription?: string | null;
  seoTitle?: string | null;
};
