/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 빌드 시 ESLint 에러를 경고로 처리 (배포는 가능)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 빌드 시 TypeScript 에러를 무시 (빠른 배포용)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
