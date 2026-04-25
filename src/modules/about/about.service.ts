import { inject, singleton } from "tsyringe";
import { TOKENS } from "../../shared/container/tokens";
import { normalizeUploadPayload } from "../uploads/upload-url";
import { IAboutRepository } from "./about.repository.interface";
import { ABOUT_PAGE_ID, createDefaultAboutPageInput } from "./about.defaults";
import { AboutPage, AboutInputBlock, UpsertAboutPageInput } from "./about.types";

const normalizeBlocks = (blocks: AboutInputBlock[]) =>
  blocks.map((block) => ({
    data: normalizeUploadPayload(block.data),
    id: block.id,
    type: block.type,
  }));

@singleton()
export class AboutService {
  constructor(
    @inject(TOKENS.AboutRepository)
    private readonly repository: IAboutRepository
  ) {}

  private async ensurePage(): Promise<AboutPage> {
    const existingPage = await this.repository.getPage();

    if (existingPage) {
      return existingPage;
    }

    const defaults = createDefaultAboutPageInput();
    await this.repository.savePage({
      blocks: normalizeBlocks(defaults.blocks),
      id: ABOUT_PAGE_ID,
      seoDescription: defaults.seoDescription || null,
      seoTitle: defaults.seoTitle || null,
    });

    return (await this.repository.getPage()) as AboutPage;
  }

  public async getAdminPage() {
    return this.ensurePage();
  }

  public async getPublicPage() {
    return this.ensurePage();
  }

  public async updatePage(input: UpsertAboutPageInput) {
    const currentPage = await this.repository.getPage();

    await this.repository.savePage({
      blocks: normalizeBlocks(input.blocks),
      createdAt: currentPage ? new Date(currentPage.createdAt) : undefined,
      id: ABOUT_PAGE_ID,
      seoDescription: input.seoDescription || null,
      seoTitle: input.seoTitle || null,
    });

    return this.ensurePage();
  }
}
