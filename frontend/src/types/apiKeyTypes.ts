export interface ApiKey {
  api_key_id: string;
  key_name: string;
  key_id: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}
