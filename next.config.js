/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Excalidraw uses some Node.js APIs (fs, path, crypto) that need to be polyfilled
  // In Next.js 16, Turbopack is the default bundler
  // Note: If you encounter issues with Turbopack, you can opt out by using --webpack flag:
  //   "dev": "next dev --webpack"
  //   "build": "next build --webpack"
  turbopack: {
    resolveAlias: {
      // Polyfill Node.js modules for browser compatibility
      // These prevent bundling errors when Excalidraw references Node.js APIs
      fs: {
        browser: './lib/polyfills/empty.ts',
      },
      path: {
        browser: './lib/polyfills/empty.ts',
      },
      crypto: {
        browser: './lib/polyfills/empty.ts',
      },
    },
  },
};

module.exports = nextConfig;
