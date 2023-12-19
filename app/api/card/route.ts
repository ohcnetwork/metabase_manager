import { Card } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { printRequestError } from "@/app/server_utils";
import { cardList, getCardCreateBody } from "./utils";
import { getMapping, updateMapping, createMapping } from "../database/mapping/utils";


export async function GET(req: NextRequest) {
  const { host, session_token, card_entity_id } = Object.fromEntries(req.nextUrl.searchParams.entries());

  const data = await cardList(host, session_token, card_entity_id);

  return NextResponse.json(data);
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
      await updateMapping(card_data.entity_id, data.entity_id, dest_host, "card");
    } else {
      await createMapping(card_data.entity_id, data.entity_id, source_host, dest_host, "card");
    }
  }

  return NextResponse.json(data);
}
