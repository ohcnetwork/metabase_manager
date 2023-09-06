import { createRouter } from "@hattip/router";
import { renderPage } from "vite-plugin-ssr/server";
import { telefunc } from "telefunc";
import * as Sentry from "@sentry/node";

const router = createRouter();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.4,
});


/**
 * Telefunc route
 *
 * @link {@see https://telefunc.com}
 **/
router.post("/_telefunc", async (context) => {
  const reqBody = await context.request.text();
  const httpResponse = await telefunc({
    url: context.url.toString(),
    method: context.method,
    body: reqBody,
    context,
  });
  try {
    if (JSON.parse(httpResponse.body)?.["ret"]?.["errors"]) {
      Sentry.captureEvent({
        timestamp: new Date().getTime() / 1000,
        platform: "node",
        level: "error",
        request: {
          url: context.url.toString(),
          method: context.method,
          data: reqBody,
        },
        message: JSON.stringify(JSON.parse(httpResponse.body)?.["ret"]?.["errors"]),
        extra: httpResponse,
      });
    }
  } catch (e) {
    console.error("Error sending to sentry", e);
    Sentry.captureEvent({
      timestamp: new Date().getTime() / 1000,
      platform: "node",
      level: "error",
      request: {
        url: context.url.toString(),
        method: context.method,
        data: reqBody,
      },
      message: httpResponse.body.toString(),
      extra: httpResponse,
    });
  }
  const { body, statusCode, contentType } = httpResponse;
  return new Response(body, {
    status: statusCode,
    headers: {
      "content-type": contentType,
    },
  });
});

/**
 * Vike route
 *
 * @link {@see https://vite-plugin-ssr.com}
 **/
router.use(async (context) => {
  const pageContextInit = { urlOriginal: context.request.url };
  const pageContext = await renderPage(pageContextInit);
  const response = pageContext.httpResponse;

  return new Response(await response?.getBody(), {
    status: response?.statusCode,
    headers: response?.headers,
  });
});

export default router.buildHandler();
