import type { NextConfig } from "next";
import { withAxiom } from "next-axiom";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Next bloquea el acceso a recursos de dev desde hosts que no son localhost.
  // El túnel de ngrok (webhook de MercadoPago en local) necesita estar acá.
  // Solo aplica a `next dev`; en producción se ignora.
  allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok-free.app', '*.ngrok.io'],

  // /admin/banners y /admin/hero se fusionaron en /admin/home. Se redirigen
  // para no dejar en 404 un favorito viejo del panel.
  async redirects() {
    return [
      { source: '/admin/banners', destination: '/admin/home', permanent: false },
      { source: '/admin/hero', destination: '/admin/home', permanent: false },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

// Axiom captura automáticamente los logs del servidor.
const withAxiomConfig = withAxiom(nextConfig);

// Sentry envuelve la config para subir source maps e instrumentar.
// Sin SENTRY_AUTH_TOKEN (dev) simplemente no sube source maps.
export default withSentryConfig(withAxiomConfig, {
  ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
  ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
  ...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
  silent: !process.env.CI,
  disableLogger: true,
});
