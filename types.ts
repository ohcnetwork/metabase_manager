export type Question = {
  id?: number;
  visualization_settings?: any;
  parameters?: any;
  description?: string;
  collection_position?: number;
  result_metadata?: any;
  collection_id?: number;
  name?: string;
  cache_ttl?: number;
  dataset_query?: any;
  parameter_mappings?: any;
  display?: any;
};

export type Server = {
  host: string;
  session_token: string;
  database?: string;
  collection?: string;
  questions?: Question[];
};

export type Database = {
  id: string;
  name: string;
  description: string;
};

export type SyncStatusText = "present" | "ready" | "syncing" | "success" | "error";

export type SyncStatus = {
  id: string;
  source_server: Server;
  destination_server: Server;
  question: Question;
  status: SyncStatusText;
  checked: boolean;
};
