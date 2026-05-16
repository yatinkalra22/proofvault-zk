/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared-types is shipped as TS source via `main: "./src/index.ts"` so Next
  // needs to transpile it. Add new workspace deps to this list as they land.
  transpilePackages: ['@proofvault/shared-types'],
};

export default nextConfig;
