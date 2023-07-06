import { useEffect, useState } from "react";
import { ServerInput } from "../../components/ServerInput";
import { Toaster, toast } from "react-hot-toast";
import { Question, Server, SyncStatus, SyncStatusText } from "../../types";
import { onCardCreate, onCardList, onCollectionItemsList } from "../../server/metabase.telefunc";
import { formatHostUrl } from "../../utils";

export { Page };

function Page() {
  const [sourceServers, setSourceServers] = useState<Server[]>([]);
  const [destinationServers, setDestinationServers] = useState<Server[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [progressBar, setProgressBar] = useState({
    value: 0,
    color: "bg-[#0c80cec5]",
  });

  useEffect(() => {
    const checkedSyncQues = syncStatus.filter((s) => s.checked);
    const completedSyncStatus = checkedSyncQues.filter((s) => s.status === "success" || s.status === "error");
    setProgressBar((progressBar) => ({
      ...progressBar,
      value: (completedSyncStatus.length / checkedSyncQues.length) * 100,
      color: completedSyncStatus.some((s) => s.status === "error") ? "bg-red-400" : "bg-[#0c80cec5]",
    }));
  }, [syncStatus]);

  async function syncQuestion(sourceServer: Server, destinationServer: Server, question: Question, syncID: string) {
    setSyncStatus((syncStatus) => syncStatus.map((s) => (s.id === syncID ? { ...s, status: "syncing" } : s)));
    try {
      const res = await toast.promise(
        onCardCreate(
          sourceServer.host,
          destinationServer.host,
          sourceServer.session_token,
          destinationServer.session_token,
          destinationServer.database,
          question,
          destinationServer.collection
        ),
        {
          loading: "Syncing question...",
          success: "Question synced!",
          error: "Failed to sync question",
        }
      );
      if (res["error"]) {
        throw new Error(res["error"]);
      }
      setSyncStatus((syncStatus) => syncStatus.map((s) => (s.id === syncID ? { ...s, status: "success" } : s)));
    } catch (e) {
      console.error(e);
      setSyncStatus((syncStatus) => syncStatus.map((s) => (s.id === syncID ? { ...s, status: "error" } : s)));
    }
  }

  function getSyncStatusTextColor(status: SyncStatusText): string | undefined {
    switch (status) {
      case "present":
        return "text-blue-500";
      case "ready":
        return "text-gray-500";
      case "syncing":
        return "text-yellow-500";
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return undefined;
    }
  }

  async function getQuestions(host: string, session_token: string, colletion_id?: string) {
    const allQuestions = await onCardList(host, session_token);
    if (colletion_id && colletion_id != "-1") {
      const collectionQuestions = await onCollectionItemsList(host, session_token, colletion_id, "card");
      return allQuestions.filter((question: Question) =>
        collectionQuestions["data"].some((card: Question) => card.id === question.id)
      );
    }
    return allQuestions;
  }

  async function loadSyncData(): Promise<void> {
    const updatedSourceServers = await Promise.all(
      sourceServers.map(async (s) => ({ ...s, questions: await getQuestions(s.host, s.session_token, s.collection) }))
    );
    setSourceServers(updatedSourceServers);

    const updatedDestServers = await Promise.all(
      destinationServers.map(async (s) => ({
        ...s,
        questions: await getQuestions(s.host, s.session_token, s.collection),
      }))
    );
    setDestinationServers(updatedDestServers);

    const syncStatus = updatedSourceServers.flatMap((server) =>
      server.questions.flatMap((question) =>
        updatedDestServers.map((destServer) => ({
          id: `${destServer.host}-${question.name}`,
          source_server: server,
          destination_server: destServer,
          question,
        }))
      )
    );

    // Duplicates are detected by the question name for now
    setSyncStatus(
      syncStatus.map((s) => {
        const isUnique = s.destination_server?.questions?.find((q) => q.name === s.question.name) === undefined;
        return { ...s, ...(isUnique ? { status: "ready", checked: true } : { status: "present", checked: false }) };
      })
    );
  }

  function startSync() {
    setProgressBar({ value: 0, color: "bg-[#0c80cec5]" });
    const checkedSyncQues = syncStatus.filter((s) => s.checked);
    checkedSyncQues.forEach(async (ques) => {
      syncQuestion(ques.source_server, ques.destination_server, ques.question, ques.id);
    });
  }

  return (
    <div className="bg-white py-6">
      <Toaster position="top-right" />
      <div className="mx-auto max-w-4xl text-base leading-7 text-gray-700 border rounded-lg border-gray-300 px-8 py-8">
        <p className="text-3xl font-semibold leading-7 text-[#034078] text-center">Metabase Manager</p>
        <p className="mt-3 text-xl leading-8 text">
          Use Metabase Manager to synchronize your Metabase instance. You can copy question cards from the source
          instances to destination instances.
        </p>
      </div>
      <div className="mt-5 mx-auto max-w-4xl text-base leading-7 text-gray-700 border rounded-lg border-gray-300 px-8 py-6">
        <p className="text-2xl font-bold leading-7 text-zinc-700 text-center">Source Instances</p>
        <ServerInput
          type="source"
          onAdd={(server) => {
            setSourceServers((servers) => [...servers, server]);
          }}
          onRemove={(server) => {
            setSourceServers((servers) => servers.filter((s) => s.host !== server.host));
            setSyncStatus([]);
          }}
        />
      </div>
      <div className="mt-5 mx-auto max-w-4xl text-base leading-7 border rounded-lg border-gray-300 px-8 py-6">
        <p className="text-2xl font-bold text-black text-center">Destination Instances</p>
        <ServerInput
          type="destination"
          onAdd={(server) => {
            setDestinationServers((servers) => [...servers, server]);
          }}
          onRemove={(server) => {
            setDestinationServers((servers) => servers.filter((s) => s.host !== server.host));
            setSyncStatus([]);
          }}
        />
      </div>
      {syncStatus.length === 0 && (
        <div className="mt-5 justify-center flex flex-col mx-auto max-w-4xl text-base leading-7 border rounded-lg border-gray-300 px-8 py-6">
          <button
            onClick={() => {
              if (sourceServers.length === 0 || destinationServers.length === 0) {
                toast.error("Please add at least one source and destination instance");
                return;
              }
              toast.promise(loadSyncData(), {
                loading: "Loading sync data...",
                success: "Sync data loaded!",
                error: "Failed to load sync data",
              });
            }}
            type="button"
            className="rounded-md bg-[#1e6091] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#168aad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Proceed
          </button>
        </div>
      )}
      {syncStatus.length > 0 && (
        <div className="mt-5 justify-center flex flex-col mx-auto max-w-4xl text-base leading-7 border rounded-lg border-gray-300 px-8 py-6">
          <div className="relative w-full bg-gray-200 rounded mb-4">
            <div
              className={`relative top-0 h-4 rounded progress-bar overflow-hidden ${progressBar.color} ${
                progressBar.value < 100 && "progress-bar-animate"
              }`}
              style={{ width: `${progressBar.value}%` }}
            ></div>
          </div>
          <div className="relative overflow-x-auto border border-gray-300 rounded-md mb-4">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="p-4 ">
                    <div className="flex items-center">
                      <input
                        id="checkbox-all"
                        type="checkbox"
                        checked={syncStatus.every((s) => s.checked)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSyncStatus((syncStatus) => syncStatus.map((s) => ({ ...s, checked })));
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="checkbox-all" className="sr-only">
                        checkbox
                      </label>
                    </div>
                  </th>
                  <th scope="col" className="py-3 px-2">
                    Source
                  </th>
                  <th scope="col" className="py-3 px-2">
                    Destination
                  </th>
                  <th scope="col" className="py-3 px-2">
                    Question
                  </th>
                  <th scope="col" className="py-3 px-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {syncStatus.map((status, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b hover:bg-gray-50"
                    onClick={() => {
                      setSyncStatus((syncStatus) =>
                        syncStatus.map((s) => (s.id === status.id ? { ...s, checked: !s.checked } : s))
                      );
                    }}
                  >
                    <td className="w-4 p-4">
                      <div className="flex items-center">
                        <input
                          id={`checkbox-table-${index}`}
                          type="checkbox"
                          checked={status.checked}
                          onChange={(e) => {
                            const checked = (e.target as HTMLInputElement).checked;
                            setSyncStatus((syncStatus) =>
                              syncStatus.map((s) => (s.id === status.id ? { ...s, checked } : s))
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`checkbox-table-${index}`} className="sr-only">
                          checkbox
                        </label>
                      </div>
                    </td>
                    <th scope="row" className="py-4 px-2 font-medium text-gray-900">
                      {formatHostUrl(status.source_server.host)}
                    </th>
                    <th scope="row" className="py-4 px-2 font-medium text-gray-900">
                      {formatHostUrl(status.destination_server.host)}
                    </th>
                    <th scope="row" className="py-4 px-2 font-medium text-gray-900">
                      {status.question.name}
                    </th>
                    <td
                      scope="row"
                      className={`px-2 py-4 font-medium capitalize ${getSyncStatusTextColor(status.status)}`}
                    >
                      {status.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={startSync}
            className="rounded-md bg-[#1e6091] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#168aad] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Syncronize
          </button>
        </div>
      )}
    </div>
  );
}
