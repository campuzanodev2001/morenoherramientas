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
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
});
