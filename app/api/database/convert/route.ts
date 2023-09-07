import { printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    host,
    session_token,
    database,
    query,
    query_type,
  }: {
    host: string;
    session_token: string;
    database: string;
    query: object;
    query_type: string;
  } = await req.json();

  const postBody = {
    database: database != "-1" ? database : null,
    pretty: true,
    query: query,
    type: query_type,
  };

  const res = await fetch(`${host}/api/dataset/native`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
    body: JSON.stringify(postBody),
  });

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("POST", `${host}/api/dataset/native`, data, postBody, res);
    return NextResponse.json({ error: data["cause"] || data["errors"], raw: data }, { status: 500 });
  }
  return NextResponse.json(data);
}
