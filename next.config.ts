import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'seo-heist.s3.amazonaws.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'github.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'ansubkhan.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'utfs.io',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'images.clerk.dev',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'img.clerk.com',
      port: '',
      pathname: '/**'
    }, {
      protocol: 'https',
      hostname: 'js.clerk.dev',
      port: '',
      pathname: '/**'
    }]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
