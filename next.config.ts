import type { NextConfig } from "next";
import { withAxiom } from "next-axiom";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
