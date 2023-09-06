export function formatHostUrl(url: string) {
    return url.replace(/(^\w+:|^)\/\//, "");
  }
  