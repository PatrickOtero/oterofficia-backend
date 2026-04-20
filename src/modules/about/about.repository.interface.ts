import { AboutPage, AboutInputBlock } from "./about.types";

export type AboutPagePersistenceInput = {
  blocks: AboutInputBlock[];
  createdAt?: Date;
  id: string;
  seoDescription: string | null;
  seoTitle: string | null;
};

export interface IAboutRepository {
  getPage(): Promise<AboutPage | null>;
  savePage(input: AboutPagePersistenceInput): Promise<void>;
}
