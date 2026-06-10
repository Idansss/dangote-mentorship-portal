import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const projectRoot = dirname(fileURLToPath(import.meta.url));

// next-intl is configured WITHOUT i18n routing (locale resolved from a cookie),
// so middleware stays dedicated to auth/RBAC. See src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root; an unrelated lockfile higher up the tree would
  // otherwise be inferred as the root.
  outputFileTracingRoot: projectRoot,
  experimental: {
    // Server actions are enabled by default in Next 15; keep body limit explicit
    // for the data-import flows that arrive in M1.
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default withNextIntl(nextConfig);
