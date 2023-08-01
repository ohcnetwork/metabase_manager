export type OrderedCard = {
  size_x?: number;
  series?: any[];
  action_id?: any;
  collection_authority_level?: any;
  card: Card;
  updated_at?: string;
  col?: number;
  id?: number;
  parameter_mappings?: any[];
  card_id?: number;
  entity_id?: string;
  visualization_settings?: any[];
  size_y?: number;
  dashboard_id?: number;
  created_at?: string;
  row?: number;
};

export type Dashboard = {
  archived?: boolean;
  cache_ttl?: null;
  can_write?: boolean;
  caveats?: null;
  collection_authority_level?: null;
  collection_id?: number;
  collection_position?: null;
  created_at?: string;
  creator_id?: number;
  description?: string;
  embedding_params?: null;
  enable_embedding?: boolean;
  entity_id?: string;
  id: number;
  is_app_page?: boolean;
  name?: string;
  ordered_cards?: OrderedCard[];
  param_fields?: null;
  parameters?: any[];
  points_of_interest?: null;
  position?: null;
  public_uuid?: null;
  show_in_getting_started?: boolean;
  updated_at?: string;
};

export type Card = {
  id?: number;
  visualization_settings?: any;
  parameters?: any;
  description?: string;
  collection_position?: number;
  result_metadata?: any;
  collection_id?: number;
  name?: string;
  entity_id?: string;
  cache_ttl?: number;
  dataset_query?: any;
  parameter_mappings?: any;
  display?: any;
  archived?: boolean;
};

export type Server = {
  host: string;
  session_token: string;
  database?: string;
  collection?: string;
  questions?: Card[] | Dashboard[];
  schema?: DatabaseMeta;
};

export type Database = {
  id: string;
  name: string;
  description: string;
};

export type SyncStatusText = "in-sync" | "outdated" | "ready" | "syncing" | "success" | "error";

export type SyncStatus = {
  id: string;
  source_server: Server;
  destination_server: Server;
  question: Dashboard | Card;
  status: SyncStatusText;
  mapped_ques?: Card;
  checked: boolean;
  entity_type: "card" | "dashboard";
};

export type DatabaseMeta = {
  description?: null;
  features?: string[];
  cache_field_values_schedule?: string;
  timezone?: string;
  auto_run_queries?: boolean;
  metadata_sync_schedule?: string;
  name?: string;
  caveats?: null;
  tables?: Table[];
  creator_id?: number;
  is_full_sync?: boolean;
  updated_at?: Date;
  cache_ttl?: null;
  is_sample?: boolean;
  id?: number;
  is_on_demand?: boolean;
  options?: null;
  engine?: string;
  initial_sync_status?: InitialSyncStatus;
  refingerprint?: null;
  created_at?: Date;
  points_of_interest?: null;
};

export type InitialSyncStatus = "complete";

export type Table = {
  description?: null;
  entity_type?: EntityType;
  schema?: Schema;
  show_in_getting_started?: boolean;
  name?: string;
  fields?: Field[];
  caveats?: null;
  segments?: any[];
  updated_at?: Date;
  active?: boolean;
  id?: number;
  db_id?: number;
  visibility_type?: null;
  field_order?: FieldOrder;
  initial_sync_status?: InitialSyncStatus;
  display_name?: string;
  metrics?: any[];
  created_at?: Date;
  points_of_interest?: null;
};

export type EntityType = "entity/GenericTable" | "entity/UserTable" | "entity/TransactionTable" | "entity/EventTable";

export type FieldOrder = "database";

export type Field = {
  description?: null;
  database_type?: DatabaseType;
  semantic_type?: SemanticType | null;
  table_id?: number;
  coercion_strategy?: null;
  name?: string;
  fingerprint_version?: number;
  has_field_values?: HasFieldValues;
  settings?: null;
  caveats?: null;
  fk_target_field_id?: number | null;
  updated_at?: Date;
  custom_position?: number;
  effective_type?: EType;
  active?: boolean;
  nfc_path?: string[] | null;
  parent_id?: null;
  id?: number;
  last_analyzed?: Date | null;
  position?: number;
  visibility_type?: VisibilityType;
  target?: Field | null;
  preview_display?: boolean;
  display_name?: string;
  database_position?: number;
  database_required?: boolean;
  fingerprint?: Fingerprint | null;
  created_at?: Date;
  base_type?: EType;
  points_of_interest?: null;
};

export type EType =
  | "type/BigInteger"
  | "type/UUID"
  | "type/DateTimeWithLocalTZ"
  | "type/Boolean"
  | "type/Text"
  | "type/Integer"
  | "type/Decimal"
  | "type/IPAddress"
  | "type/Structured"
  | "type/Date"
  | "type/Array"
  | "type/Float"
  | "type/Number"
  | "type/DateTime"
  | "type/*";

export type DatabaseType =
  | "int8"
  | "uuid"
  | "timestamptz"
  | "bool"
  | "text"
  | "varchar"
  | "serial"
  | "int4"
  | "int2"
  | "numeric"
  | "inet"
  | "bigserial"
  | "jsonb"
  | "date"
  | "bigint"
  | "double precision"
  | "timestamp"
  | "float8"
  | "_varchar"
  | "name";

export type Fingerprint = {
  global?: Global;
  type?: Type;
};

export type Global = {
  "distinct-count"?: number;
  "nil%"?: number;
};

export type Type = {
  "type/Text"?: TypeText;
  "type/DateTime"?: TypeDateTime;
  "type/Number"?: TypeNumber;
};

export type TypeDateTime = {
  earliest?: Date | null;
  latest?: Date | null;
};

export type TypeNumber = {
  min?: number | null;
  q1?: number | null;
  q3?: number | null;
  max?: number | null;
  sd?: number | null;
  avg?: number | null;
};

export type TypeText = {
  "percent-json"?: number;
  "percent-url"?: number;
  "percent-email"?: number;
  "percent-state"?: number;
  "average-length"?: number;
};

export type HasFieldValues = "none" | "list" | "search";

export type SemanticType =
  | "type/PK"
  | "type/Category"
  | "type/CreationTimestamp"
  | "type/Name"
  | "type/Email"
  | "type/FK"
  | "type/IPAddress"
  | "type/Owner"
  | "type/Description"
  | "type/SerializedJSON"
  | "type/Company"
  | "type/URL"
  | "type/Latitude"
  | "type/Longitude"
  | "type/Share"
  | "type/Quantity"
  | "type/Author"
  | "type/Source"
  | "type/Title"
  | "type/Comment"
  | "type/JoinTimestamp";

export type VisibilityType = "normal" | "details-only";

export type Schema = "public";
