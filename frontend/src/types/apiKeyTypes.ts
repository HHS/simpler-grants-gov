import { APIResponse } from "./apiResponseTypes";

// list and rename return metadata only, never the key itself
export interface ApiKey {
  api_key_id: string;
  key_name: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

// the full key is only returned once, when it is created
export interface CreatedApiKey extends ApiKey {
  key_id: string;
}

export interface ApiKeyResponse extends APIResponse {
  data: ApiKey[];
}
