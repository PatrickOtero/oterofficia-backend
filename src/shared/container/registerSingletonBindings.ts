import type { DependencyContainer, InjectionToken } from "tsyringe";

type SingletonBinding<T = unknown> = readonly [InjectionToken<T>, new (...args: any[]) => T];

export const registerSingletonBindings = (
  container: DependencyContainer,
  bindings: readonly SingletonBinding[]
) => {
  bindings.forEach(([token, implementation]) => {
    container.registerSingleton(token, implementation);
  });
};
