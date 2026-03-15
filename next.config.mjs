/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for catching issues early
  reactStrictMode: true,

  // Allow cross-origin images if needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
