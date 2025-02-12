export interface SavedOpportunity {
  opportunity_id: number;
  opportunity_status: "forecasted" | "posted" | "closed" | "archived";
  opportunity_title: string | null;
  summary: {
    close_date: string | null;
    is_forecast: boolean;
    post_date: string | null;
  };
}
