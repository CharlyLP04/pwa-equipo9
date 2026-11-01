import {getSecurityHeaders} from './src/lib/security/csp-policy.mjs';
/** @type {import('next').NextConfig} */
const nextConfig={reactStrictMode:true,async headers(){return [{source:'/:path*',headers:getSecurityHeaders()}];}};
export default nextConfig;
