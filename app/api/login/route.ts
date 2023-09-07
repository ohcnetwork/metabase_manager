import { printRequestError } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const {
    host,
    email,
    password,
  }: {
    host: string;
    email: string;
    password: string;
  } = await req.json();
  const res = await fetch(`${host}/api/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: email, password: password }),
  });
  const data = await res.json();

  if (data["cause"] || data["errors"]) {
    printRequestError("POST", req.url, data, { username: "-Redacted-", password: "-Redacted-" }, res);
    return NextResponse.json({ error: data });
  }
  return NextResponse.json(data);
}
