import { apiFetch } from "@/services/api-client";
import { parseJson } from "@/services/service-utils";

export async function getRankings({ scope = "global", gameId = "" } = {}) {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (gameId) params.set("gameId", gameId);

  const response = await apiFetch(`/social/rankings?${params.toString()}`);
  return parseJson(response, "Khong the tai bang xep hang");
}
