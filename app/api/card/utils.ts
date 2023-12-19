import { printRequestError } from "@/app/server_utils";
import { Card } from "@/types";
import { deleteMapping } from "../database/mapping/utils";

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

export async function getCardCreateBody(card_data: Card, collection_id?: string, database_id?: string) {
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