import { Abort } from "telefunc";
import { Dashboard, OrderedCard } from "../types";
import { onCreateMapping, onDeleteMapping, onGetMapping, onUpdateMapping } from "./database.telefunc";
import { getCardDetailsByEntityID } from "./metabase.card.telefunc";
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

async function onDashboardList(host: string, session_token: string): Promise<Dashboard[]> {
  const res = await fetch(`${host}/api/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const json = await res.json();
  if (json["cause"]) {
    printRequestError("GET", `${host}/api/dashboard`, json);
    throw Abort({
      errorMessage: json["cause"],
    });
  }

  return json;
}

async function getOrderedCards(
  source_ordered_cards: OrderedCard[],
  dest_collection_id: string | undefined,
  source_host: string,
  destination_host: string,
  dest_session_token: string,
  dest_dashboard_id: string
) {
  const dest_cards = [];
  for (const ordered_card of source_ordered_cards) {
    const dest_card_id = await onGetMapping(
      ordered_card?.card?.entity_id ?? "",
      "dashboard",
      source_host,
      destination_host
    );
    const dest_card_data = await getCardDetailsByEntityID(
      destination_host,
      dest_session_token,
      dest_card_id?.[0].destinationCardID || ""
    );
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
      throw Abort({
        errorMessage: `Card "${ordered_card?.card?.name}" not found at destination`,
      });
    }

    return dest_cards;
  }
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

async function getDashboardDetailsByID(host: string, session_token: string, dashboard_id: number): Promise<Dashboard> {
  const res = await fetch(`${host}/api/dashboard/${dashboard_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });
  const dash = await res.json();
  if (!dash) {
    await onDeleteMapping(host, dashboard_id.toString(), "dashboard");
    throw Abort({
      errorMessage: `Dashboard "${dashboard_id}" not found`,
    });
  }
  return dash;
}

async function onDashboardCreate(
  source_host: string,
  dest_host: string,
  source_session_token: string,
  dest_session_token: string,
  destination_database: string | undefined,
  dashboard_data: Dashboard,
  collection_id: string | undefined,
  dest_dashboard_id: number | undefined
) {
  let method;
  let url;
  let dashboard_id = dest_dashboard_id;

  if (dashboard_id !== undefined) {
    method = "PUT";
    url = `${dest_host}/api/dashboard/${dest_dashboard_id}`;

    const existingDashboardData = await getDashboardDetailsByID(dest_host, dest_session_token, dest_dashboard_id ?? -1);

    for (const ordered_card of existingDashboardData.ordered_cards ?? []) {
      if (!ordered_card?.card?.entity_id) continue; //Exclude text, link and other non question cards
      const url = `${dest_host}/api/dashboard/${dest_dashboard_id}/cards?dashcardId=${ordered_card.id}`;
      const card_res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Metabase-Session": dest_session_token,
        },
      });
      if (card_res.status != 204) {
        const card_res_json = await card_res.json();
        printRequestError("DELETE", url, card_res_json);
        throw Abort({
          errorMessage: `Error while deleting card "${ordered_card.card.name}" from dashboard "${dest_dashboard_id}"`,
        });
      }
    }

    // const dashboard_card_res = await fetch(`${dest_host}/api/dashboard/${dest_dashboard_id}/cards`, {
    //   method: "PUT",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Metabase-Session": dest_session_token,
    //   },
    //   body: JSON.stringify({
    //     cards: [],
    //   }),
    // });
    // const card_res_json = await dashboard_card_res.json();

    // if (card_res_json["cause"])
    //   throw Abort({
    //     errorMessage: card_res_json["cause"],
    //   });

    const res = await fetch(`${dest_host}/api/dashboard/${dest_dashboard_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Metabase-Session": dest_session_token,
      },
      body: JSON.stringify({ ...existingDashboardData, ordered_cards: [] }),
    });

    const json = await res.json();
    if (json["cause"]) {
      printRequestError("PUT", `${dest_host}/api/dashboard/${dest_dashboard_id}`, json, {
        ...existingDashboardData,
        ordered_cards: [],
      });
      throw Abort({
        errorMessage: json["cause"],
      });
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
      printRequestError(method, url, json, dashboardCreateDetails);
      throw Abort({
        errorMessage: json["cause"],
      });
    }

    const existingMapping = await onGetMapping(dashboard_data?.id?.toString(), "dashboard", source_host, dest_host);

    if (existingMapping?.length > 0) {
      await onUpdateMapping(dashboard_data?.id?.toString(), json["id"].toString(), dest_host);
    } else {
      await onCreateMapping(dashboard_data?.id?.toString(), json["id"].toString(), source_host, dest_host, "dashboard");
    }

    method = "PUT";
    url = `${dest_host}/api/dashboard/${json["id"]}`;

    dashboard_id = json["id"];
  }

  const fullDashboardData = await getDashboardDetailsByID(source_host, source_session_token, dashboard_data.id);

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
    printRequestError(method, url, json_update, dashboardUpdateDetails);
    throw Abort({
      errorMessage: json_update["cause"],
    });
  }

  const dashboard_cards = [];

  for (const ordered_card of fullDashboardData.ordered_cards ?? []) {
    if (!ordered_card?.card?.entity_id) continue; //Exclude text, link and other non question cards

    const destCardSyncedId = await onGetMapping(ordered_card?.card?.entity_id ?? "", "card", source_host, dest_host);

    if (destCardSyncedId?.length === 0)
      throw Abort({
        errorMessage: `Card "${ordered_card?.card?.name}" not found at destination. Please sync the card first.`,
      });

    const dest_card_data = await getCardDetailsByEntityID(
      dest_host,
      dest_session_token,
      destCardSyncedId?.[0]?.destinationCardID || ""
    );
    const postBody = {
      cardId: dest_card_data?.id,
      col: ordered_card.col || 0,
      row: ordered_card.row || 0,
      size_x: ordered_card.size_x || 4,
      size_y: ordered_card.size_y || 3,
      series: ordered_card.series || [],
      parameter_mappings: ordered_card.parameter_mappings || [],
      visualization_settings: ordered_card.visualization_settings || {},
    };
    const card_res = await fetch(`${dest_host}/api/dashboard/${dashboard_id}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Metabase-Session": dest_session_token,
      },
      body: JSON.stringify(postBody),
    });
    const card_res_json = await card_res.json();

    if (card_res_json["cause"]) {
      printRequestError("POST", `${dest_host}/api/dashboard/${dashboard_id}/cards`, card_res_json, postBody);
      throw Abort({
        errorMessage: card_res_json["cause"],
      });
    }

    const dest_card_id = card_res_json["id"];

    delete ordered_card.entity_id;
    delete ordered_card.created_at;
    delete ordered_card.updated_at;

    dashboard_cards.push({
      ...ordered_card,
      id: parseInt(dest_card_id),
    });
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
    printRequestError("PUT", `${dest_host}/api/dashboard/${dashboard_id}/cards`, card_res_json, {
      cards: dashboard_cards,
    });
    throw Abort({
      errorMessage: card_res_json["cause"],
    });
  }

  return card_res_json;
}

export { onDashboardCreate, onDashboardList, getOrderedCards };
