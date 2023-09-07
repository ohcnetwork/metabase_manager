import { Dashboard } from "@/types";
import { baseUrl, printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";
import { createMapping, deleteMapping, getMapping, updateMapping } from "../database/mapping/route";
import { cardList } from "../card/route";

export async function dashboardList(host: string, session_token: string, dashboard_id?: string) {
  const url = dashboard_id ? `${host}/api/dashboard/${dashboard_id}` : `${host}/api/dashboard`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("GET", `${host}/api/dashboard`, data, {}, res);
    return { error: data["cause"] || data["errors"], raw: data };
  }

  if (dashboard_id) {
    if (res.status === 404) {
      await deleteMapping(host, dashboard_id.toString(), "dashboard");
      return { error: `Dashboard "${dashboard_id}" not found` };
    }
  }

  return data;
}

export async function GET(req: NextRequest) {
  const { host, session_token, dashboard_id } = Object.fromEntries(req.nextUrl.searchParams.entries());

  const data = await dashboardList(host, session_token, dashboard_id);

  return NextResponse.json(data);
}

async function getDashboardUpdateBody(dashboard_data: Dashboard, collection_id: string | undefined) {
  if (!dashboard_data) return null;
  return {
    description: dashboard_data.description,
    archived: dashboard_data.archived,
    collection_position: dashboard_data.collection_position,
    can_write: true,
    enable_embedding: dashboard_data.enable_embedding,
    collection_id: parseInt(collection_id || "-1"),
    show_in_getting_started: false,
    name: dashboard_data.name,
    caveats: dashboard_data.caveats,
    is_app_page: dashboard_data.is_app_page,
    embedding_params: dashboard_data.embedding_params,
    cache_ttl: dashboard_data.cache_ttl,
    position: dashboard_data.position,
    parameters: dashboard_data.parameters,
    points_of_interest: dashboard_data.points_of_interest,
  };
}

async function getDashboardCreateBody(dashboard_data: Dashboard, collection_id?: string) {
  if (!dashboard_data) return null;
  return {
    name: dashboard_data.name,
    description: dashboard_data.description,
    parameters: dashboard_data.parameters,
    collection_position: dashboard_data.collection_position,
    cache_ttl: dashboard_data.cache_ttl,
    collection_id: collection_id && collection_id != "-1" ? parseInt(collection_id) : null,
  };
}

export async function POST(req: NextRequest) {
  const {
    source_host,
    dest_host,
    source_session_token,
    dest_session_token,
    destination_database,
    dashboard_data,
    collection_id,
    dest_dashboard_id,
  }: {
    source_host: string;
    dest_host: string;
    source_session_token: string;
    dest_session_token: string;
    destination_database: string | undefined;
    dashboard_data: Dashboard;
    collection_id: string | undefined;
    dest_dashboard_id: number | undefined;
  } = await req.json();

  let method;
  let url;
  let dashboard_id = dest_dashboard_id;
  let existingDashboardData = undefined;

  if (dashboard_id && dashboard_id !== undefined) {
    method = "PUT";
    url = `${dest_host}/api/dashboard/${dest_dashboard_id}`;

    let existingDashboardDataUrl = new URL(`${baseUrl}/dashboard`);

    Object.entries({
      host: dest_host,
      session_token: dest_session_token,
      dashboard_id: dest_dashboard_id ?? -1,
    }).forEach(([key, value]) => {
      existingDashboardDataUrl.searchParams.append(key, value.toString());
    });

    const existingDashboardDataRes = await fetch(existingDashboardDataUrl.toString());
    existingDashboardData = await existingDashboardDataRes.json();

    const res = await fetch(`${dest_host}/api/dashboard/${dest_dashboard_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Metabase-Session": dest_session_token,
      },
      body: JSON.stringify({ ...existingDashboardData }),
    });

    const json = await res.json();
    if (json["cause"]) {
      printRequestError(
        "PUT",
        `${dest_host}/api/dashboard/${dest_dashboard_id}`,
        json,
        {
          ...existingDashboardData,
        },
        res
      );
      return NextResponse.json({ error: json["cause"], raw: json });
    }
  } else {
    method = "POST";
    url = `${dest_host}/api/dashboard`;

    const dashboardCreateDetails = await getDashboardCreateBody(dashboard_data, collection_id);

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Metabase-Session": dest_session_token,
      },
      body: JSON.stringify(dashboardCreateDetails),
    });

    const json = await res.json();
    if (json["cause"]) {
      printRequestError(method, url, json, dashboardCreateDetails, res);
      return NextResponse.json({ error: json["cause"], raw: json });
    }

    const existingMapping = await getMapping(dashboard_data?.id?.toString(), "dashboard", source_host, dest_host);

    if (existingMapping?.length > 0) {
      await updateMapping(dashboard_data?.id?.toString(), json["id"].toString(), dest_host);
    } else {
      await createMapping(dashboard_data?.id?.toString(), json["id"].toString(), source_host, dest_host, "dashboard");
    }

    method = "PUT";
    url = `${dest_host}/api/dashboard/${json["id"]}`;

    dashboard_id = json["id"];
  }

  let fullDashboardDataDataUrl = new URL(`${baseUrl}/dashboard`);

  Object.entries({
    host: source_host,
    session_token: source_session_token,
    dashboard_id: dashboard_data.id,
  }).forEach(([key, value]) => {
    fullDashboardDataDataUrl.searchParams.append(key, value.toString());
  });

  const fullDashboardDataRes = await fetch(fullDashboardDataDataUrl.toString());

  const fullDashboardData = await fullDashboardDataRes.json();

  const dashboardUpdateDetails = await getDashboardUpdateBody(fullDashboardData, collection_id);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": dest_session_token,
    },
    body: JSON.stringify(dashboardUpdateDetails),
  });

  const json_update = await res.json();
  if (json_update["cause"]) {
    printRequestError(method, url, json_update, dashboardUpdateDetails, res);
    return NextResponse.json({ error: json_update["cause"], raw: json_update });
  }

  const dashboard_cards = [];

  if (existingDashboardData) {
    for (const ordered_card of existingDashboardData.ordered_cards ?? []) {
      if (!ordered_card?.card?.entity_id) {
        dashboard_cards.push(ordered_card); // Add text, link and other non question cards
      }
    }
  }

  let negative_index = -1;
  for (const ordered_card of fullDashboardData.ordered_cards ?? []) {
    if (!ordered_card?.card?.entity_id) continue; // Exclude text, link and other non question cards

    const destCardSyncedId = await getMapping(ordered_card?.card?.entity_id ?? "", "card", source_host, dest_host);

    if (destCardSyncedId?.length === 0)
      return NextResponse.json({
        error: `Card "${ordered_card?.card?.name}" not found at destination. Please sync the card first.`,
      });

    const dest_card_data = await cardList(
      dest_host,
      dest_session_token,
      destCardSyncedId?.[0]?.destinationCardID || ""
    );
    const postBody = {
      id: negative_index,
      dashboard_id: dashboard_id,
      dashboard_tab_id: ordered_card.dashboard_tab_id || null,
      action_id: ordered_card.action_id || null,
      card_id: dest_card_data?.id,
      col: ordered_card.col || 0,
      row: ordered_card.row || 0,
      size_x: ordered_card.size_x || 4,
      size_y: ordered_card.size_y || 3,
      series: ordered_card.series || [],
      parameter_mappings: ordered_card.parameter_mappings || [],
      visualization_settings: ordered_card.visualization_settings || {},
    };

    for (const parameter_mapping of postBody.parameter_mappings) {
      if (parameter_mapping.card_id) {
        parameter_mapping.card_id = dest_card_data?.id;
      }
    }

    dashboard_cards.push(postBody);
    negative_index--;
  }

  const dashboard_card_res = await fetch(`${dest_host}/api/dashboard/${dashboard_id}/cards`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": dest_session_token,
    },
    body: JSON.stringify({
      cards: dashboard_cards,
    }),
  });
  const card_res_json = await dashboard_card_res.json();

  if (card_res_json["cause"]) {
    printRequestError(
      "PUT",
      `${dest_host}/api/dashboard/${dashboard_id}/cards`,
      card_res_json,
      {
        cards: dashboard_cards,
      },
      dashboard_card_res
    );
    return NextResponse.json({ error: card_res_json["cause"], raw: card_res_json });
  }

  return NextResponse.json(card_res_json);
}
