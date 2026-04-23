import { container } from "tsyringe";
import { registerProviderBindings } from "./modules/providers.module";
import { registerRepositoryBindings } from "./modules/repositories.module";

registerRepositoryBindings(container);
registerProviderBindings(container);

export { container };
