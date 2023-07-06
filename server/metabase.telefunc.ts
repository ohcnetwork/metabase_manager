import { Question } from "../types";

async function getCardCreateBody(
  host: string,
  session_token: string,
  card_data: Question,
  collection_id?: string,
  database_id?: string
) {
  if (!card_data) return null;
  if (card_data.dataset_query.type !== "native") {
    const nativeDataset = await onDatasetQueryConvert(
      host,
      session_token,
      card_data.dataset_query.database,
      card_data.dataset_query.query,
      card_data.dataset_query.type
    );
    card_data.dataset_query.query = nativeDataset.query;
  }
  return {
    visualization_settings: card_data.visualization_settings,
    parameters: card_data.parameters,
    description: card_data.description,
    collection_position: card_data.collection_position,
    result_metadata: card_data.result_metadata,
    collection_id: collection_id && collection_id != "-1" ? parseInt(collection_id) : null,
    name: card_data.name,
    cache_ttl: card_data.cache_ttl,
    dataset_query: {
      type: "native",
      native: { query: card_data.dataset_query.query, "template-tags": {} },
      database: database_id ? parseInt(database_id) : null,
    },
    parameter_mappings: card_data.parameter_mappings,
    display: card_data.display,
  };
}

async function onCardList(host: string, session_token: string): Promise<Question[]> {
  const res = await fetch(`${host}/api/card`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["error"]) throw new Error(json["error"]);
  return json;
}

async function onCardCreate(
  source_host: string,
  dest_host: string,
  source_session_token: string,
  dest_session_token: string,
  destination_database: string | undefined,
  card_data: Question,
  collection_id?: string
) {
  const cardDetails = await getCardCreateBody(
    source_host,
    source_session_token,
    card_data,
    collection_id,
    destination_database
  );
  const res = await fetch(`${dest_host}/api/card`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": dest_session_token,
    },
    body: JSON.stringify(cardDetails),
  });
  const json = await res.json();
  if (json["error"]) throw new Error(json["error"]);
  return json;
}

async function onCollectionItemsList(
  host: string,
  session_token: string,
  collection_id: string,
  item_type: string
): Promise<Question[] | any> {
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
  if (json["error"]) throw new Error(json["error"]);
  return json;
}

async function onCollectionsList(host: string, session_token: string) {
  const res = await fetch(`${host}/api/collection`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["error"]) throw new Error(json["error"]);
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
  if (json["error"]) throw new Error(json["error"]);
  return json;
}

async function onDatasetQueryConvert(
  host: string,
  session_token: string,
  database: string,
  query: object,
  query_type: string
) {
  const res = await fetch(`${host}/api/dataset/native`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
    body: JSON.stringify({
      database: database != "-1" ? database : null,
      pretty: true,
      query: query,
      type: query_type,
    }),
  });
  const json = await res.json();
  if (json["error"]) throw new Error(json["error"]);
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
  if (json["error"]) throw new Error(json["error"]);
  return json;
}

export {
  onCardList,
  onCardCreate,
  onDatabaseList,
  onCollectionsList,
  onDatasetQueryConvert,
  onCollectionItemsList,
  onLogin,
};
