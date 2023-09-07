import { printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { host, session_token } = Object.fromEntries(req.nextUrl.searchParams.entries());
  const res = await fetch(`${host}/api/database`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Metabase-Session": session_token,
    },
  });

  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("GET", `${host}/api/database`, data, {}, res);
    return NextResponse.json({ error: data["cause"] || data["errors"], raw: data });
  }
  return NextResponse.json(data);
}
