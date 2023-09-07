import { printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function collectionList(host: string, session_token: string) {
  const url = `${host}/api/collection/tree?tree=true&exclude-other-user-collections=true&exclude-archived=true`;
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
    return { error: data["cause"] || data["errors"], raw: data };
  }
  return data;
}

export async function GET(req: NextRequest) {
  const { host, session_token } = Object.fromEntries(req.nextUrl.searchParams.entries());
  const data = await collectionList(host, session_token);
  return NextResponse.json(data, { status: data.error ? 500 : 200 });
}

export async function POST(req: NextRequest) {
  const {
    host,
    session_token,
    collection_name,
    parent_id,
  }: { host: string; session_token: string; collection_name: string; parent_id: string } = await req.json();
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

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("POST", `${host}/api/collection`, data, postBody, res);
    return NextResponse.json({ error: data["cause"] || data["errors"], raw: data });
  }
  return NextResponse.json(data);
}
