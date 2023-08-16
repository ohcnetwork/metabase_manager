export function printRequestError(method: string, url: string, resJSON: any, reqJSON?: any) {
  try {
    console.error(`
      ERROR
      ===============>
      ${method} | ${url}
      ${JSON.stringify(reqJSON, null, 2)}
      <==============
      ${JSON.stringify(resJSON, null, 2)}`);
  } catch (e) {
    console.error(method, url, reqJSON, resJSON);
  }
}
