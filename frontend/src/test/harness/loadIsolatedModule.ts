/**
 * Loads a module inside a fresh Jest module registry.
 *
 * This ensures:
 * - mocks are applied before the module is evaluated
 * - no cross-test module state leaks
 *
 * Intended for App Router pages and wrapper-heavy modules.
 */
export function loadIsolatedModule<ExportedModule>(
  modulePath: string,
  registerMocks: () => void,
): ExportedModule {
  let loadedModule: ExportedModule | null = null;

  jest.isolateModules(() => {
    registerMocks();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    loadedModule = require(modulePath) as ExportedModule;
  });

  if (loadedModule === null) {
    throw new Error(`Failed to load isolated module: ${modulePath}`);
  }

  return loadedModule;
}
