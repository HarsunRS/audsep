/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/studio',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
