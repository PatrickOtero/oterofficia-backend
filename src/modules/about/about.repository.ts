import { singleton } from "tsyringe";
import { getDataSource } from "../../shared/infra/database/data-source";
import { AboutPageEntity } from "../../shared/infra/database/entities/AboutPageEntity";
import { normalizeUploadPayload } from "../uploads/upload-url";
import { IAboutRepository, AboutPagePersistenceInput } from "./about.repository.interface";
import { AboutBlock, AboutInputBlock, AboutPage } from "./about.types";

const toIso = (value: Date | string) => new Date(value).toISOString();

const normalizeBlock = (block: AboutInputBlock): AboutBlock => ({
  data:
    block.data && typeof block.data === "object" && !Array.isArray(block.data)
      ? normalizeUploadPayload(block.data)
      : {},
  id: String(block.id),
  type: block.type,
});

const mapPage = (entity: AboutPageEntity): AboutPage => ({
  blocks: Array.isArray(entity.blocks)
    ? entity.blocks
        .filter((block): block is AboutInputBlock => Boolean(block && typeof block === "object"))
        .map((block) => normalizeBlock(block))
    : [],
  createdAt: toIso(entity.createdAt),
  id: entity.id,
  seoDescription: entity.seoDescription,
  seoTitle: entity.seoTitle,
  updatedAt: toIso(entity.updatedAt),
});

@singleton()
export class AboutRepository implements IAboutRepository {
  public async getPage() {
    const dataSource = await getDataSource();
    const entity = await dataSource.getRepository(AboutPageEntity).findOne({
      where: { id: "main-about-page" },
    });

    return entity ? mapPage(entity) : null;
  }

  public async savePage(input: AboutPagePersistenceInput) {
    const dataSource = await getDataSource();
    const repository = dataSource.getRepository(AboutPageEntity);
    const existing = await repository.findOne({ where: { id: input.id } });
    const now = new Date();

    await repository.save({
      blocks: input.blocks.map((block) => normalizeBlock(block)),
      createdAt: existing?.createdAt || input.createdAt || now,
      id: input.id,
      seoDescription: input.seoDescription,
      seoTitle: input.seoTitle,
      updatedAt: now,
    });
  }
}
