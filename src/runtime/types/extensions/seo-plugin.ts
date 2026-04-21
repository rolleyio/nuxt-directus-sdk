import type { TypegenExtension } from './index.ts'

/**
 * Supports directus-labs/seo-plugin v 1.1.1
 * https://github.com/directus-labs/extensions/tree/main/packages/seo-plugin
 */

const interfaceName = 'DirectusLabsSeoPlugin'

export const extension: TypegenExtension = {
  name(prefix) { return `${prefix}${interfaceName}` },
  isMatch(field) {
    return (
      field.type === 'json'
      && field.meta?.interface === 'seo-interface'
      && field.meta?.special?.includes('cast-json') === true
    )
  },
  output(prefix) {
    return `
interface ${prefix}${interfaceName} {
    title?: string;
    meta_description?: string;
    og_image?: string;
    additional_fields?: Record<string, unknown>;
    sitemap?: {
        change_frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
        priority: string;
    };
    no_index?: boolean;
    no_follow?: boolean;
}`
  },
}
