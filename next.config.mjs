/** @type {import('next').NextConfig} */
const nextConfig = {
  output:
    process.env.BUILD_STANDALONE === "true" || process.env.DOCKER_BUILD === "1"
      ? "standalone"
      : undefined,
};

export default nextConfig;
