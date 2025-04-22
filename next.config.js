// import type { NextConfig } from 'next';

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle node-specific modules for client-side
    if (!isServer) {
      // Polyfill node modules for browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Ignore server-only imports to avoid errors
      config.module = {
        ...config.module,
        exprContextCritical: false,
      };
    }
    return config;
  },
  
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    }, {
      protocol: 'https',
      hostname: 'exlzmywslwybtzejypoh.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**'
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
