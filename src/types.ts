import type { TemplateResult } from 'lit';

export type Locale = 'en' | 'yue' | 'both';
export type NativeApi = {
  updater?(operation:'status'|'check'|'restart'):Promise<unknown>;
  capabilities(): Promise<{ version: string; capabilities: string[] }>;
  request(operation: string, input?: unknown): Promise<{ ok: boolean; value?: unknown; error?: string }>;
};
export type FeatureContext = {
  locale: Locale;
  translate(en: string, yue: string): string;
  notify(message: string, kind?: 'info' | 'success' | 'error'): void;
  navigate(id: string): void;
  native?: NativeApi;
};
export type FeatureDefinition = {
  id: string;
  title: { en: string; yue: string };
  group: string;
  render(context: FeatureContext): TemplateResult;
};
export type FeatureRegistry = { register(feature: FeatureDefinition): void };

declare global {
  interface Window { jacksonNative?: NativeApi; }
}
