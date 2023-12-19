import { Server, Settings } from "@/types";
import toast from "react-hot-toast";
import { collectionList, dbSchemaFetch, login, databaseList } from "./api";

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

export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function exportConfig(sourceServers: Server[], destinationServers: Server[], settings: Settings) {
  downloadJson(
    {
      sourceServers: sourceServers.map((s) => ({
        host: s.host,
        session_token: s.session_token,
        email: s.email,
        password: s.password,
        database: s.database,
        collection: s.collection,
      })),
      destinationServers: destinationServers.map((s) => ({
        host: s.host,
        session_token: s.session_token,
        email: s.email,
        password: s.password,
        database: s.database,
        collection: s.collection,
        excludedIDs: s.excludedIDs,
      })),
      settings,
    },
    `metabase-manager-config-${new Date().toISOString()}.json`
  );
}

function validateServer(server: Server) {
  if (!server.host) {
    throw Error("Host is required");
  }
  if (!server.session_token && (!server.email || !server.password)) {
    throw Error("Session token or email and password are required");
  }
  if (!server.database) {
    throw Error("Database is required");
  }
  if (!server.collection) {
    throw Error("Collection is required");
  }
  return true;
}

async function hydrateServer(server: Server) {
  validateServer(server);
  let { host, session_token, email, password, database, collection, excludedIDs } = server;

  if (!host.startsWith("http")) host = "https://" + host;
  if (host.endsWith("/")) host = host.slice(0, -1);

  if (email && password) {
    const session_token_res = await login(host, email, password);
    session_token = session_token_res["id"];
  }

  if (!session_token) throw Error("Session token is invalid, check your credentials");

  const schema = await dbSchemaFetch(host, session_token, database ?? "0");

  const collectionTree = await collectionList(host, session_token);

  const databases = (await databaseList(host, session_token));

  return { host, email, password, session_token, database, collection, schema, collectionTree, excludedIDs, databaseList: databases.data };
}

export function importConfig(
  callback: (type: string, server: Server, settings: Settings) => void
): Promise<{ sourceServers: Server[]; destinationServers: Server[] }> {
  return new Promise((resolve, reject) => {
    const fileSelector = document.createElement("input");
    fileSelector.setAttribute("type", "file");
    fileSelector.setAttribute("accept", ".json");
    fileSelector.onchange = async (event) => {
      const fileList = (event.target as HTMLInputElement)?.files;
      if (!fileList || fileList.length === 0) {
        reject(new Error("No file selected."));
        return;
      }
      const file = fileList[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContents = event.target?.result;
        if (typeof fileContents === "string") {
          const config = JSON.parse(fileContents);
          const { sourceServers, destinationServers }: { sourceServers: Server[]; destinationServers: Server[] } =
            config;
          if (!sourceServers || !destinationServers) {
            reject(new Error("Invalid config file. Source and destination servers must be specified."));
            return;
          }

          const hydratedSourceServers = [];
          for (const server of sourceServers) {
            try {
              const hydratedServer = await toast.promise(hydrateServer(server), {
                loading: "Importing source server " + server.host,
                success: "Imported source server " + server.host,
                error: (err) => {
                  return "Error importing source server " + server.host + " : " + err.message;
                },
              });
              hydratedSourceServers.push(hydratedServer);
              callback("source", hydratedServer, config.settings);
            } catch (e: any) {
              reject(new Error("Error importing source server " + server.host + ": " + e.message));
              return;
            }
          }

          const hydratedDestinationServers = [];
          for (const server of destinationServers) {
            try {
              const hydratedServer = await toast.promise(hydrateServer(server), {
                loading: "Importing destination server " + server.host,
                success: "Imported destination server " + server.host,
                error: (err) => {
                  return "Error importing destination server " + server.host + " : " + err.message;
                },
              });
              hydratedDestinationServers.push(hydratedServer);
              callback("destination", hydratedServer, config.settings);
            } catch (e: any) {
              reject(new Error("Error importing destination server " + server.host + ": " + e.message));
              return;
            }
          }

          resolve({ sourceServers: hydratedSourceServers, destinationServers: hydratedDestinationServers });
        }
      };
      reader.readAsText(file);
    };
    fileSelector.click();
  });
}
