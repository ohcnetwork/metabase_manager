import { prisma } from "@/app/api/_base";

export async function clearAllMapping(hosts: string[]) {
    return await prisma.syncMapping.deleteMany({
        where: {
            OR: [
                {
                    sourceServer: {
                        in: hosts
                    }
                },
                {
                    destinationServer: {
                        in: hosts
                    }
                }
            ]
        },
    });
}
