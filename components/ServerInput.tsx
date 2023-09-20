"use client";

import { useEffect, useState } from "react";
import { Database, Server } from "../types";
import toast from "react-hot-toast";
import { login, collectionList, databaseList, dbSchemaFetch } from "@/app/api";
import { formatHostUrl } from "@/app/utils";
import { Tree, InteractionMode, ControlledTreeEnvironment, TreeItemIndex } from "react-complex-tree";
import "react-complex-tree/lib/style-modern.css";

export { ServerInput };

function ServerInput(props: {
  type: "source" | "destination";
  servers: Server[];
  onAdd: (server: Server) => void;
  onRemove: (server: Server) => void;
}) {
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [servers, setServers] = useState<Server[]>(props.servers ?? []);
  const [inForm, setInForm] = useState(false);
  const [databasesList, setDatabasesList] = useState<Database[]>([]);
  const [collectionsList, setCollectionsList] = useState<Database[]>([]);
  const [disableAddButton, setDisableAddButton] = useState(false);
  const [form, setForm] = useState({
    host: "",
    session_token: "",
    email: "",
    password: "",
    database: "-1",
    collection: "-1",
    schema: null,
    collectionTree: null,
  });
  const [loginMethod, setLoginMethod] = useState<"session" | "password">("password");

  useEffect(() => {
    setExpandedItems([collectionsList?.[0]?.id?.toString()]);
  }, [collectionsList]);

  useEffect(() => {
    setServers(props.servers ?? []);
  }, [props.servers]);

  async function fetchDatabases(session_token: string) {
    if (!form.host || !session_token) {
      toast.error("Host and Session Token are required");
      return;
    }
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    const databases = await toast.promise(databaseList(host, session_token), {
      loading: "Fetching databases",
      success: "Databases fetched!",
      error: "Error fetching databases",
    });
    if (databases.data.length === 0) {
      toast.error("No databases found on the server");
      return;
    }
    setDatabasesList(databases.data);
  }

  async function fetchSessionToken(host: string) {
    const session_token = await toast.promise(login(host, form.email, form.password), {
      loading: "Fetching session token from login credentials",
      success: "Session token fetched!",
      error: "Error fetching session token! Check your credentials",
    });
    setForm((form) => ({ ...form, session_token: session_token["id"] }));
    return session_token["id"];
  }

  async function fetchCollections(session_token: string) {
    if (!form.host || !session_token) {
      toast.error("Host and Session Token are required");
      return;
    }
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    const collections = await toast.promise(collectionList(host, session_token), {
      loading: "Fetching collections",
      success: "Collections fetched!",
      error: "Error fetching collections",
    });
    setCollectionsList(collections);
    setForm((form) => ({ ...form, collectionTree: collections }));
  }

  async function addServerClick() {
    let host = form.host;
    if (!host.startsWith("http")) host = "https://" + host;
    if (host.endsWith("/")) host = host.slice(0, -1);

    if (form.database != "-1") {
      setDisableAddButton(true);
      try {
        const schema = await toast.promise(dbSchemaFetch(host, form.session_token, form.database), {
          loading: "Fetching database schema",
          success: "Database schema fetched!",
          error: "Error fetching database schema",
        });
        props.onAdd({ ...form, host, schema });
        setServers((servers) => [...servers, { ...form, host, schema }]);
        resetForm();
        setDisableAddButton(false);
        return;
      } catch (e) {
        setDisableAddButton(false);
        return;
      }
    }

    let session_token = form.session_token;

    if (loginMethod === "password") {
      session_token = await fetchSessionToken(host);
      if (!session_token) return;
    }

    fetchDatabases(session_token);
    fetchCollections(session_token);
  }

  function resetForm() {
    setInForm(false);
    setForm({
      host: "",
      session_token: "",
      email: "",
      password: "",
      database: "-1",
      collection: "-1",
      schema: null,
      collectionTree: null,
    });
    setLoginMethod("password");
    setDatabasesList([]);
    setCollectionsList([]);
  }

  function convertCollectionTree(jsonObj: any, parentName?: string) {
    const result: { [key: string]: any } = {};
    if (Array.isArray(jsonObj)) {
      for (const item of jsonObj) {
        Object.assign(result, convertCollectionTree(item, parentName));
      }
    } else if (typeof jsonObj === "object") {
      const name: string = jsonObj["id"].toString();
      const children = jsonObj["children"];
      const childNames = children.map((child: any) => child["id"].toString());
      result[name] = {
        index: jsonObj["id"].toString(),
        isFolder: Boolean(children.length),
        children: childNames,
        data: jsonObj["name"],
      };
      for (const child of children) {
        Object.assign(result, convertCollectionTree(child, name));
      }
    }
    return result;
  }

  if (inForm) {
    return (
      <div className="flex flex-col">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Host</label>
          <input
            data-testid={`host-${props.type}`}
            className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
            type="text"
            value={form.host}
            onChange={(e) => {
              setForm((form) => ({ ...form, host: e.target.value }));
            }}
            placeholder="https://server.metabase.tld"
          />
        </div>
        <div className="mb-4">
          <div className="flex justify-between ">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {loginMethod === "session" ? "Session Token" : "Credentials"}{" "}
            </label>
            <button
              data-testid={`toggle-login-method-${props.type}`}
              className="justify-end w-5 h-5 mb-2 fill-[#1e6091] hover:fill-blue-300"
              onClick={() => {
                setLoginMethod(loginMethod === "session" ? "password" : "session");
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="signin" className="text-blue-500">
                <path d="M20,12a1,1,0,0,0-1-1H11.41l2.3-2.29a1,1,0,1,0-1.42-1.42l-4,4a1,1,0,0,0-.21.33,1,1,0,0,0,0,.76,1,1,0,0,0,.21.33l4,4a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L11.41,13H19A1,1,0,0,0,20,12ZM17,2H7A3,3,0,0,0,4,5V19a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V16a1,1,0,0,0-2,0v3a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V5A1,1,0,0,1,7,4H17a1,1,0,0,1,1,1V8a1,1,0,0,0,2,0V5A3,3,0,0,0,17,2Z"></path>
              </svg>
            </button>
          </div>
          {loginMethod === "session" && (
            <input
              className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
              type="password"
              data-testid={`session_token-${props.type}`}
              value={form.session_token}
              onChange={(e) => {
                setForm((form) => ({ ...form, session_token: e.target.value }));
              }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          )}
          {loginMethod === "password" && (
            <div className="flex gap-3 flex-row">
              <input
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                type="text"
                data-testid={`email-${props.type}`}
                value={form.email}
                onChange={(e) => {
                  setForm((form) => ({ ...form, email: e.target.value }));
                }}
                placeholder="Email"
              />
              <input
                className="border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                type="password"
                data-testid={`password-${props.type}`}
                value={form.password}
                onChange={(e) => {
                  setForm((form) => ({ ...form, password: e.target.value }));
                }}
                placeholder="Password"
              />
            </div>
          )}
        </div>

        <div className={`relative w-full mb-4 ${databasesList.length === 0 ? "hidden" : "block"}`}>
          <label className="block text-gray-700 text-sm font-bold mb-2">Database</label>
          <select
            data-testid={`database-${props.type}`}
            className="w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight"
            value={form.database}
            onChange={(e) => {
              setForm((form) => ({ ...form, database: e.target.value }));
            }}
          >
            <option key="-1" value="-1">
              Select the database
            </option>
            {databasesList.map((database) => (
              <option key={database.id} value={database.id}>
                {database.name}
              </option>
            ))}
          </select>
        </div>

        <div className={`relative w-full mb-4 ${collectionsList.length === 0 ? "hidden" : "block"}`}>
          <label className="block text-gray-700 text-sm font-bold mb-2">Collections</label>
          <div className="w-full border border-gray-400 rounded shadow leading-tight p-1">
            <ControlledTreeEnvironment
              items={{
                ...convertCollectionTree(collectionsList),
                root: {
                  index: "root",
                  isFolder: true,
                  children: collectionsList.map((collection) => collection?.id?.toString()),
                  data: "All Collections",
                },
              }}
              viewState={{
                [`collection-list-${props.type}`]: {
                  focusedItem,
                  expandedItems,
                  selectedItems,
                },
              }}
              getItemTitle={(item) => item.data}
              defaultInteractionMode={InteractionMode.ClickArrowToExpand}
              onFocusItem={(item) => setFocusedItem(item.index)}
              onExpandItem={(item) => {
                setExpandedItems([...expandedItems, item.index]);
              }}
              onCollapseItem={(item) =>
                setExpandedItems(expandedItems.filter((expandedItemIndex) => expandedItemIndex !== item.index))
              }
              onSelectItems={(items) => {
                setSelectedItems([items[items.length - 1]]);
                setForm((form) => ({
                  ...form,
                  collection: items?.[0]?.toString(),
                }));
              }}
            >
              <Tree treeId={`collection-list-${props.type}`} rootItem="root" />
            </ControlledTreeEnvironment>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            data-testid={`cancel-${props.type}`}
            type="button"
            onClick={resetForm}
            className="w-full rounded-md bg-gray-300 hover:bg-gray-400  px-3 py-2 text-sm font-bold shadow-sm"
          >
            Cancel
          </button>
          <button
            data-testid={`add-${props.type}`}
            type="button"
            disabled={disableAddButton}
            onClick={addServerClick}
            className="w-full rounded-md bg-[#1e6091] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#168aad] disabled:bg-gray-700 disabled:text-white"
          >
            {form.database === "-1" || form.collection === "-1" ? "Fetch Databases & Collections" : "Add Server"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-3 text-xl leading-8 grid grid-cols-1 ${servers.length > 0 && "sm:grid-cols-3"} gap-6`}>
      {servers.map((server) => (
        <div key={server.host} className="flex">
          <button
            data-testid={`remove-${props.type}`}
            type="button"
            onClick={() => {
              props.onRemove(server);
              setServers((servers) => servers.filter((s) => s.host !== server.host));
            }}
            className="w-full items-center flex flex-col rounded-lg border-2 border-solid border-gray-300 p-11 text-center hover:border-red-400"
          >
            <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 24 24">
              <path
                fill="#1e8467"
                d="M15,17a1,1,0,1,0,1,1A1,1,0,0,0,15,17ZM9,17H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9,0a1,1,0,1,0,1,1A1,1,0,0,0,18,17Zm-3-6a1,1,0,1,0,1,1A1,1,0,0,0,15,11ZM9,11H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9-6a1,1,0,1,0,1,1A1,1,0,0,0,18,5Zm0,6a1,1,0,1,0,1,1A1,1,0,0,0,18,11Zm4-6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V7a3,3,0,0,0,.78,2A3,3,0,0,0,2,11v2a3,3,0,0,0,.78,2A3,3,0,0,0,2,17v2a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V17a3,3,0,0,0-.78-2A3,3,0,0,0,22,13V11a3,3,0,0,0-.78-2A3,3,0,0,0,22,7ZM20,19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V17a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5A1,1,0,0,1,4,7V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1ZM15,5a1,1,0,1,0,1,1A1,1,0,0,0,15,5ZM9,5H6A1,1,0,0,0,6,7H9A1,1,0,0,0,9,5Z"
              ></path>
            </svg>
            <span className="mt-2 block text-sm font-semibold text-black">{formatHostUrl(server.host)}</span>
            {server.database != "-1" && (
              <span className="mt-2 block text-sm font-semibold text-black">
                {databasesList.find((d) => d.id === server.database)?.name}
              </span>
            )}
            {server.collection != "-1" && (
              <span className="mt-2 block text-sm font-semibold text-black">
                {collectionsList.find((c) => c.id === server.collection)?.name}
              </span>
            )}
          </button>
        </div>
      ))}

      <button
        data-testid={`add-${props.type}`}
        type="button"
        onClick={() => {
          setInForm(true);
        }}
        className="items-center flex flex-col rounded-lg border-2 border-dashed border-gray-300 p-11 text-center hover:border-gray-400 w-full"
      >
        <svg className="h-16 w-16" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 24 24">
          <path
            fill="#274c77"
            d="M15,17a1,1,0,1,0,1,1A1,1,0,0,0,15,17ZM9,17H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9,0a1,1,0,1,0,1,1A1,1,0,0,0,18,17Zm-3-6a1,1,0,1,0,1,1A1,1,0,0,0,15,11ZM9,11H6a1,1,0,0,0,0,2H9a1,1,0,0,0,0-2Zm9-6a1,1,0,1,0,1,1A1,1,0,0,0,18,5Zm0,6a1,1,0,1,0,1,1A1,1,0,0,0,18,11Zm4-6a3,3,0,0,0-3-3H5A3,3,0,0,0,2,5V7a3,3,0,0,0,.78,2A3,3,0,0,0,2,11v2a3,3,0,0,0,.78,2A3,3,0,0,0,2,17v2a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V17a3,3,0,0,0-.78-2A3,3,0,0,0,22,13V11a3,3,0,0,0-.78-2A3,3,0,0,0,22,7ZM20,19a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V17a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1H19a1,1,0,0,1,1,1Zm0-6a1,1,0,0,1-1,1H5A1,1,0,0,1,4,7V5A1,1,0,0,1,5,4H19a1,1,0,0,1,1,1ZM15,5a1,1,0,1,0,1,1A1,1,0,0,0,15,5ZM9,5H6A1,1,0,0,0,6,7H9A1,1,0,0,0,9,5Z"
          ></path>
        </svg>
        <span className="mt-2 block text-sm font-semibold text-black">Add a new {props.type} instance</span>
      </button>
    </div>
  );
}
