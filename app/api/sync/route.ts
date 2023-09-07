import { Card, Dashboard, Server, SyncMapping, SyncStatusText } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { createMapping, getMapping, updateMapping } from "../database/mapping/route";
import { cardList } from "../card/route";
import { dashboardList } from "../dashboard/route";
import { checkChangesRequired, findCollectionId, findPath } from "@/app/utils";
import { collectionList } from "../collection/route";

async function getExistingCollectionPath(
  source_server: Server,
  destination_server: Server,
  source_root_id: string | undefined,
  destination_root_id: string | undefined,
  source_card_collection_id: string | undefined
) {
  const sourcePath = findPath(source_server.collectionTree, source_card_collection_id, source_root_id);
  const destPath = findPath(destination_server.collectionTree, destination_root_id, destination_root_id);
  const destCollectionTree = await collectionList(destination_server.host, destination_server.session_token);

  let lastId = parseInt(destination_root_id ?? "-1");
  for (let i = 1; i < sourcePath.length; i++) {
    const collectionName = sourcePath[i];
    const destCollectionID = findCollectionId(destCollectionTree, collectionName, destPath[i - 1]);

    if (destCollectionID == null) {
      return -1;
    } else {
      lastId = destCollectionID;
      destPath.push(collectionName);
    }
  }
  return lastId;
}

export async function POST(req: NextRequest) {
  const {
    sourceServers,
    destServers,
  }: {
    sourceServers: Server[];
    destServers: Server[];
  } = await req.json();
  const syncStatus: any[] = [];
  for (const server of sourceServers) {
    for (const question of server.questions ?? []) {
      for (const destServer of destServers) {
        const destQuestions = await cardList(destServer.host, destServer.session_token);
        const destDashboards = await dashboardList(destServer.host, destServer.session_token);

        let syncedIDs: string[] = [];
        if (question.entity_type === "dashboard")
          syncedIDs = (
            await getMapping(question?.id?.toString() || "-1", "dashboard", server.host, destServer.host)
          ).map((d: SyncMapping) => d.destinationCardID);
        else
          syncedIDs = (await getMapping(question.entity_id || "-1", "card", server.host, destServer.host)).map(
            (d: SyncMapping) => d.destinationCardID
          );
        let mapped_ques;
        if (question.entity_type === "dashboard")
          mapped_ques = (destServer?.questions as Dashboard[]).find((q: any) =>
            syncedIDs.includes(q.id?.toString() || "-1")
          );
        else mapped_ques = (destServer?.questions as Card[]).find((q: any) => syncedIDs.includes(q.entity_id || "-1"));

        if (!mapped_ques) {
          const destCollectionID = await getExistingCollectionPath(
            server,
            destServer,
            server.collection,
            destServer.collection,
            question.collection_id?.toString()
          );
          if (destCollectionID != -1) {
            if (question.entity_type === "dashboard") {
              const destDashboard = destDashboards.find(
                (q: any) => q.name === question.name && q.collection_id?.toString() === destCollectionID?.toString()
              );
              if (destDashboard) {
                mapped_ques = destDashboard;
                if (syncedIDs.length == 0) {
                  await createMapping(
                    question.id.toString() || "-1",
                    destDashboard.id.toString() || "-1",
                    server.host,
                    destServer.host,
                    "dashboard"
                  );
                } else {
                  await updateMapping(
                    question.id.toString() || "-1",
                    destDashboard.id.toString() || "-1",
                    destServer.host
                  );
                }
              }
            } else {
              const destQuestion = destQuestions.find(
                (q: any) => q.name === question.name && q.collection_id?.toString() === destCollectionID?.toString()
              );
              if (destQuestion) {
                mapped_ques = destQuestion;
                if (syncedIDs.length == 0) {
                  await createMapping(
                    question.entity_id || "-1",
                    destQuestion.entity_id || "-1",
                    server.host,
                    destServer.host,
                    "card"
                  );
                } else {
                  await updateMapping(question.entity_id || "-1", destQuestion.entity_id || "-1", destServer.host);
                }
              }
            }
          }
        }

        syncStatus.push({
          id: `${destServer.host}-${question.name}-${question.entity_id ?? question.id}`,
          source_server: server,
          destination_server: destServer,
          question,
          mapped_ques,
          status: mapped_ques
            ? checkChangesRequired(question, mapped_ques)
              ? "outdated"
              : "in-sync"
            : ("ready" as SyncStatusText),
          checked: false,
          entity_type: question.entity_type,
          collection_path: question.collection_path,
        });
      }
    }
  }
  return NextResponse.json(syncStatus);
}
