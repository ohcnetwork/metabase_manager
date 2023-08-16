function printRequestError(method: string, url: string, resJSON: any, reqJSON?: any) {
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
import { Card } from "../types";
import { onCreateMapping, onDeleteMapping, onGetMapping, onUpdateMapping } from "./database.telefunc";
import { Abort } from "telefunc";

async function getCardCreateBody(card_data: Card, collection_id?: string, database_id?: string) {
  if (!card_data) return null;
  return {
    visualization_settings: card_data.visualization_settings,
    parameters: card_data.parameters,
    description: card_data.description,
    collection_position: card_data.collection_position,
    result_metadata: card_data.result_metadata,
    collection_id: collection_id && collection_id != "-1" ? parseInt(collection_id) : null,
    name: card_data.name,
    cache_ttl: card_data.cache_ttl,
    database_id: database_id ? parseInt(database_id) : card_data.dataset_query.database,
    dataset_query: {
      ...card_data.dataset_query,
      database: database_id ? parseInt(database_id) : card_data.dataset_query.database,
    },
    parameter_mappings: card_data.parameter_mappings,
    display: card_data.display,
    archived: card_data.archived ?? false,
  };
}

async function onCardList(host: string, session_token: string): Promise<Card[]> {
  const res = await fetch(`${host}/api/card`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", `${host}/api/card`, json);
    throw Abort({
      errorMessage: json["cause"],
    });
  }

  return json;
}

async function getCardDetailsByEntityID(host: string, session_token: string, card_entity_id: string): Promise<Card> {
  const cards = await onCardList(host, session_token);
  const card = cards.find((card) => card.entity_id === card_entity_id);
  if (!card) {
    await onDeleteMapping(host, card_entity_id, "card");
    throw Abort({
      errorMessage: `Card "${card_entity_id}" not found`,
    });
  }
  return card;
}

async function onCardCreate(
  source_host: string,
  dest_host: string,
  source_session_token: string,
  dest_session_token: string,
  destination_database: string | undefined,
  card_data: Card,
  collection_id?: string,
  dest_card_id?: number
) {
  const cardDetails = await getCardCreateBody(card_data, collection_id, destination_database);
  let method = "POST";
  let url = `${dest_host}/api/card`;

  if (dest_card_id !== undefined) {
    method = "PUT";
    url = `${dest_host}/api/card/${dest_card_id}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": dest_session_token,
    },
    body: JSON.stringify(cardDetails),
  });

  const json = await res.json();
  if (json["cause"]) {
    printRequestError(method, url, json, cardDetails);
    throw Abort({
      errorMessage: json["cause"],
    });
  }

  if (dest_card_id === undefined && card_data.entity_id && json.entity_id) {
    const existingMapping = await onGetMapping(card_data.entity_id, "card", source_host, dest_host);

    if (existingMapping?.length > 0) {
      await onUpdateMapping(card_data.entity_id, json.entity_id, dest_host);
    } else {
      await onCreateMapping(card_data.entity_id, json.entity_id, source_host, dest_host, "card");
    }
  }

  return json;
}

export { onCardCreate, onCardList, getCardDetailsByEntityID };
