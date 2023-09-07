export const baseUrl =
  (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000") + "/api";
import * as Sentry from "@sentry/node";

export function printRequestError(method: string, url: string, resJSON: any, reqJSON: any, httpResponse: Response) {
  try {
    console.error(`
        ERROR
        ===============>
        ${method} | ${url}
        ${JSON.stringify(reqJSON, null, 2)}
        <==============
        ${JSON.stringify(resJSON, null, 2)}`);

    Sentry.captureEvent({
      timestamp: new Date().getTime() / 1000,
      platform: "node",
      level: "error",
      message: `Metabase Request Error ${new URL(url).pathname}`,
      request: {
        url: url,
        method: method,
        data: reqJSON,
      },
      extra: {
        response: {
          status: httpResponse.status,
          data: JSON.stringify(resJSON, null, 2),
          headers: httpResponse.headers,
        },
      },
    });
  } catch (e) {
    console.error(method, url, reqJSON, resJSON);
  }
}
