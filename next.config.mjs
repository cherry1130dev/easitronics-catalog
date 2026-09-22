/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/uplode',
        destination: '/upload',
        permanent: true,
      },
      {
        source: '/dev',
        destination: '/update',
        permanent: true,
      },
      {
        source: '/developer',
        destination: '/update',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
