import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/zvdjnfzr/**",
      },
      { protocol: "https", hostname: "img.dfimoveis.com.br" },
    ],
  },
};

export default nextConfig;
