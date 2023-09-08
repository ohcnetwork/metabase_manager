import { printRequestError } from "@/app/server_utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { host, session_token, collection_id, item_type } = Object.fromEntries(req.nextUrl.searchParams.entries());

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

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("GET", url, data, {}, res);
    return NextResponse.json({ error: data["cause"] || data["errors"], raw: data });
  }
  return NextResponse.json(data);
}
