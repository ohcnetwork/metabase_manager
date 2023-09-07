import { Card } from "@/types";
import { printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { createMapping, deleteMapping, getMapping, updateMapping } from "../database/mapping/route";

export async function cardList(host: string, session_token: string, card_entity_id?: string) {
  const res = await fetch(`${host}/api/card`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("GET", `${host}/api/card`, data, {}, res);
    return {
      success: false,
      error: data["cause"] || data["errors"],
      raw: data,
    };
  }

  if (card_entity_id) {
    const card = data.find((card: any) => card.entity_id === card_entity_id);

    if (!card) {
      await deleteMapping(host, card_entity_id, "card");
      return { error: `Card "${card_entity_id}" not found` };
    }
    return card;
  }
  return data;
}

export async function GET(req: NextRequest) {
  const { host, session_token, card_entity_id } = Object.fromEntries(req.nextUrl.searchParams.entries());

  const data = await cardList(host, session_token, card_entity_id);

  return NextResponse.json(data);
}

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

export async function POST(req: NextRequest) {
  const {
    source_host,
    dest_host,
    dest_session_token,
    destination_database,
    card_data,
    collection_id,
    dest_card_id,
  }: {
    source_host: string;
    dest_host: string;
    dest_session_token: string;
    destination_database: string | undefined;
    card_data: Card;
    collection_id?: string;
    dest_card_id?: number;
  } = await req.json();

  const cardDetails = await getCardCreateBody(card_data, collection_id, destination_database);
  let method = "POST";
  let url = `${dest_host}/api/card`;

  if (dest_card_id !== undefined) {
    method = "PUT";
    url = `${dest_host}/api/card/${dest_card_id}`;
  }

  const fetchRes = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": dest_session_token,
    },
    body: JSON.stringify(cardDetails),
  });

  const data = await fetchRes.json();
  if (data["cause"] || data["errors"]) {
    printRequestError(method, url, data, cardDetails, fetchRes);
    return NextResponse.json({ error: data["cause"] || data["errors"], raw: data });
  }

  if (dest_card_id === undefined && card_data.entity_id && data.entity_id) {
    const existingMapping = await getMapping(card_data.entity_id, "card", source_host, dest_host);

    if (existingMapping?.length > 0) {
      await updateMapping(card_data.entity_id, data.entity_id, dest_host);
    } else {
      await createMapping(card_data.entity_id, data.entity_id, source_host, dest_host, "card");
    }
  }

  return NextResponse.json(data);
}
