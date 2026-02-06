// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { initBotId } from "botid/client/core";

Sentry.init({
  dsn: "https://41072d7212430e043fe4e2deb825e50a@o4510837765570560.ingest.de.sentry.io/4510837770747984",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

initBotId({
  protect: [
    {
      path: "/api/products",
      method: "GET",
    },
    {
      path: "/api/products/search",
      method: "GET",
    },
    {
      path: "/api/checkout/mpesa/initial",
      method: "POST",
    },
    {
      path: "/api/checkout/mpesa/retrial",
      method: "POST",
    },
    {
      path: "/api/checkout/paypal/initial",
      method: "POST",
    },
    {
      path: "/api/checkout/paypal/retrial",
      method: "POST",
    },
    {
      path: "/api/coupons/validate",
      method: "POST",
    },
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
