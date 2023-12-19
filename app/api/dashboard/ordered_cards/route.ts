import { NextRequest, NextResponse } from "next/server";
import { OrderedCard } from "@/types";
import { baseUrl } from "@/app/server_utils";
import { getMapping } from "../../database/mapping/utils";

export async function POST(req: NextRequest) {
  const {
    source_ordered_cards,
    dest_collection_id,
    source_host,
    destination_host,
    dest_session_token,
    dest_dashboard_id,
  }: {
    source_ordered_cards: OrderedCard[];
    dest_collection_id: string | undefined;
    source_host: string;
    destination_host: string;
    dest_session_token: string;
    dest_dashboard_id: string;
  } = await req.json();

  const dest_cards = [];
  for (const ordered_card of source_ordered_cards) {
    const dest_card_id = await getMapping(
      ordered_card?.card?.entity_id ?? "",
      "dashboard",
      source_host,
      destination_host
    );

    let card_data_url = new URL(`${baseUrl}/card`);

    Object.entries({
      host: destination_host,
      session_token: dest_session_token,
      card_entity_id: dest_card_id?.[0].destinationCardID || "",
    }).forEach(([key, value]) => {
      card_data_url.searchParams.append(key, value.toString());
    });

    const dest_card_data = await (await fetch(card_data_url.toString())).json();

    if (dest_card_id) {
      delete ordered_card.entity_id;
      delete ordered_card.created_at;
      delete ordered_card.updated_at;

      dest_cards.push({
        ...ordered_card,
        card_id: dest_card_data.id,
        collection_id: parseInt(dest_collection_id || "-1"),
        dashboard_id: dest_dashboard_id,
        card: dest_card_data,
      });
    } else {
      return NextResponse.json({ error: `Card "${ordered_card?.card?.name}" not found at destination` });
    }
  }

  return NextResponse.json(dest_cards);
}
