import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function getMapping(
  source_entity_id: string,
  type: string,
  source_host: string,
  destination_host: string
) {
  const where: {
    sourceCardID: string;
    sourceServer?: string;
    destinationServer?: string;
    type?: string;
  } = {
    sourceCardID: source_entity_id,
  };

  if (destination_host) where.destinationServer = destination_host;
  if (source_host) where.sourceServer = source_host;
  if (type) where.type = type;

  return await prisma.syncMapping.findMany({
    where,
  });
}

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

export async function createMapping(
  source_entity_id: string,
  destination_entity_id: string,
  source_server: string,
  destination_host: string,
  type: string
) {
  return await prisma.syncMapping.create({
    data: {
      sourceServer: source_server,
      sourceCardID: source_entity_id,
      destinationServer: destination_host,
      destinationCardID: destination_entity_id,
      type,
    },
  });
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

export async function updateMapping(
  source_entity_id: string,
  destination_entity_id: string,
  destination_host: string,
  type: string
) {
  return await prisma.syncMapping.update({
    where: {
      sourceCardID_destinationServer_type: {
        sourceCardID: source_entity_id,
        destinationServer: destination_host,
        type: type,
      },
    },
    data: {
      destinationCardID: destination_entity_id,
    },
  });
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

export async function deleteMapping(host: string, entity_id: string, type: string) {
  return await prisma.syncMapping.deleteMany({
    where: {
      OR: [
        {
          sourceServer: host,
          sourceCardID: entity_id,
          type,
        },
        {
          destinationServer: host,
          destinationCardID: entity_id,
          type,
        },
      ],
    },
  });
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
