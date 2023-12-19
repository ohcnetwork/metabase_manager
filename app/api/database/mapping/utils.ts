import { prisma } from "../../_base";

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