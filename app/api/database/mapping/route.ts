import { NextRequest, NextResponse } from "next/server";
import { getMapping, createMapping, updateMapping, deleteMapping } from "./utils";

export async function GET(req: NextRequest) {
  const { source_entity_id, type, source_host, destination_host } = Object.fromEntries(
    req.nextUrl.searchParams.entries()
  );
  try {
    const res = await getMapping(source_entity_id, type, source_host, destination_host);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}

export async function POST(req: NextRequest) {
  const {
    source_entity_id,
    destination_entity_id,
    source_server,
    destination_host,
    type,
  }: {
    source_entity_id: string;
    destination_entity_id: string;
    source_server: string;
    destination_host: string;
    type: string;
  } = await req.json();
  try {
    const res = await createMapping(source_entity_id, destination_entity_id, source_server, destination_host, type);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}

export async function PATCH(req: NextRequest) {
  const {
    source_entity_id,
    destination_entity_id,
    destination_host,
    type,
  }: {
    source_entity_id: string;
    destination_entity_id: string;
    destination_host: string;
    type: string;
  } = await req.json();

  try {
    const res = await updateMapping(source_entity_id, destination_entity_id, destination_host, type);
    return NextResponse.json(res);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}


export async function DELETE(req: NextRequest) {
  const {
    host,
    entity_id,
    type,
  }: {
    host: string;
    entity_id: string;
    type: string;
  } = await req.json();

  try {
    const result = await deleteMapping(host, entity_id, type);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, raw: e });
  }
}
