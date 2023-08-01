import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function onGetMapping(source_entity_id: string, destination_host?: string, type?: string) {
  const where: {
    sourceCardID: string;
    destinationServer?: string;
    type?: string;
  } = {
    sourceCardID: source_entity_id,
  };

  if (destination_host) where.destinationServer = destination_host;
  if (type) where.type = type;

  const res = await prisma.syncMapping.findMany({
    where,
  });
  return res;
}

async function onCreateMapping(
  source_entity_id: string,
  destination_entity_id: string,
  source_server: string,
  destination_host: string,
  type: string
) {
  const res = await prisma.syncMapping.create({
    data: {
      sourceServer: source_server,
      sourceCardID: source_entity_id,
      destinationServer: destination_host,
      destinationCardID: destination_entity_id,
      type,
    },
  });
  return res;
}

async function onUpdateMapping(source_entity_id: string, destination_entity_id: string, destination_host: string) {
  const res = await prisma.syncMapping.update({
    where: {
      sourceCardID_destinationServer: {
        sourceCardID: source_entity_id,
        destinationServer: destination_host,
      },
    },
    data: {
      destinationCardID: destination_entity_id,
    },
  });
  return res;
}

async function onDeleteMapping(host: string, entity_id: string, type: string) {
  const res = await prisma.syncMapping.deleteMany({
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
  return res;
}

export { onGetMapping, onCreateMapping, onUpdateMapping, onDeleteMapping };
