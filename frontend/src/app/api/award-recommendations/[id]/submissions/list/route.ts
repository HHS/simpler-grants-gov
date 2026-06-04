import { listAwardRecommendationSubmissions } from "src/app/api/award-recommendations/[id]/submissions/list/handler";

import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return listAwardRecommendationSubmissions(request, { params });
}
