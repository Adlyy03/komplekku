/**
 * Komplekku MVP Module Configuration
 * PRD v2 §3.3 & §22
 * Controls which modules are enabled for this complex deployment.
 */
export const modules = {
  residents: true,
  announcements: true,
  dues: true,
  marketplace: true,
  complaints: true,
} as const;

export type ModuleKey = keyof typeof modules;

export function isModuleEnabled(moduleKey: ModuleKey): boolean {
  return Boolean(modules[moduleKey]);
}
