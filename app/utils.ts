import { Card, Dashboard } from "@/types";

export function formatHostUrl(url: string) {
  return url.replace(/(^\w+:|^)\/\//, "");
}

export function findPath(
  jsonObj: any,
  id?: string,
  startId: string | null = null,
  path: string[] = [],
  start = false
): any {
  if (Array.isArray(jsonObj)) {
    for (const item of jsonObj) {
      const result = findPath(item, id, startId, path, start);
      if (result) return result;
    }
  } else if (typeof jsonObj === "object") {
    if (jsonObj["id"] == id && start) {
      path.push(jsonObj["name"]);
      return path;
    } else if (jsonObj["id"] == startId || start) {
      const children = jsonObj["children"];
      if (children) {
        if (start || jsonObj["id"] == startId) {
          path.push(jsonObj["name"]);
          start = true;
          if (jsonObj["id"] == id) return path;
        }
        for (const child of children) {
          const result = findPath(child, id, startId, path, start);
          if (result) return result;
        }
        if (start) path.pop();
      }
    } else {
      const children = jsonObj["children"];
      if (children) {
        for (const child of children) {
          const result = findPath(child, id, startId, path, start);
          if (result) return result;
        }
      }
    }
  }
  return null;
}

export function findCollectionId(jsonObj: any, name: string, startName?: string, start = false): any {
  if (Array.isArray(jsonObj)) {
    for (const item of jsonObj) {
      const result = findCollectionId(item, name, startName, start);
      if (result) return result;
    }
  } else if (typeof jsonObj === "object") {
    if (jsonObj["name"] == name && start) {
      return jsonObj["id"];
    } else if (jsonObj["name"] == startName || start) {
      const children = jsonObj["children"];
      if (children) {
        if (start || jsonObj["name"] == startName) {
          start = true;
        }
        for (const child of children) {
          const result = findCollectionId(child, name, startName, start);
          if (result) return result;
        }
      }
    } else {
      const children = jsonObj["children"];
      if (children) {
        for (const child of children) {
          const result = findCollectionId(child, name, startName, start);
          if (result) return result;
        }
      }
    }
  }
  return null;
}

export function checkChangesRequired(source_question: Card | Dashboard, destination_question: Card | Dashboard) {
  if (source_question.description !== destination_question.description) return true;
  if (source_question?.display !== destination_question?.display) return true;
  if (source_question.name !== destination_question.name) return true;

  return false;
}
