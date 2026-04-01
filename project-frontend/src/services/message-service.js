import { apiFetch } from "@/services/api-client";
import { parseJson } from "@/services/service-utils";

export async function getMessages() {
  const response = await apiFetch("/social/messages");
  return parseJson(response, "Khong the tai tin nhan");
}

export async function createMessage(payload) {
  const response = await apiFetch("/social/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(response, "Khong the gui tin nhan");
}
