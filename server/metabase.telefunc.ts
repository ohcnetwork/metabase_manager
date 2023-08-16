import { Abort } from "telefunc";
import { Card } from "../types";
import { printRequestError } from "./utils";

async function onCollectionItemsList(
  host: string,
  session_token: string,
  collection_id: string,
  item_type: string
): Promise<Card[] | any> {
  const sort_column = "name";
  const sort_direction = "asc";
  const url = `${host}/api/collection/${collection_id}/items?models=${item_type}&sort_column=${sort_column}&sort_direction=${sort_direction}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", url, json);
    throw Abort({ errorMessage: json["cause"] });
  }
  return json;
}

async function onCollectionsList(host: string, session_token: string) {
  const url = `${host}/api/collection/tree?tree=true&exclude-other-user-collections=true&exclude-archived=true`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", url, json);
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

async function onCreateCollection(host: string, session_token: string, collection_name: string, parent_id: string) {
  const postBody = {
    parent_id,
    authority_level: null,
    description: null,
    color: "#509EE3",
    name: collection_name,
  };

  const res = await fetch(`${host}/api/collection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
    body: JSON.stringify(postBody),
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("POST", `${host}/api/collection`, json, postBody);
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

async function onDatabaseList(host: string, session_token: string) {
  const res = await fetch(`${host}/api/database`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", `${host}/api/database`, json);
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

async function onDatasetQueryConvert(
  host: string,
  session_token: string,
  database: string,
  query: object,
  query_type: string
) {
  const postBody = {
    database: database != "-1" ? database : null,
    pretty: true,
    query: query,
    type: query_type,
  };
  const res = await fetch(`${host}/api/dataset/native`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
    body: JSON.stringify(postBody),
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("POST", `${host}/api/dataset/native`, json, postBody);
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

async function onLogin(host: string, email: string, password: string) {
  const res = await fetch(`${host}/api/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: email, password: password }),
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("POST", `${host}/api/session`, json, { username: "-Redacted-", password: "-Redacted-" });
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

async function onDBSchemaFetch(host: string, session_token: string, database: string) {
  const res = await fetch(`${host}/api/database/${database}/metadata`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", `${host}/api/database/${database}/metadata`, json);
    throw Abort({
      errorMessage: json["cause"],
    });
  }
  return json;
}

export {
  onDatabaseList,
  onCollectionsList,
  onCreateCollection,
  onDatasetQueryConvert,
  onCollectionItemsList,
  onLogin,
  onDBSchemaFetch,
};
