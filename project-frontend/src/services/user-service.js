import { apiFetch } from "@/services/api-client";
import { parseJson } from "@/services/service-utils";

export async function getUsers(query = "") {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  const response = await apiFetch(`/users${suffix}`);
  return parseJson(response, "Khong the tai danh sach nguoi dung");
}

export async function updateCurrentUserProfile(payload) {
  const response = await apiFetch("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJson(response, "Khong the cap nhat profile");
}

export async function getCurrentUserProgress() {
  const response = await apiFetch("/users/me/progress");
  return parseJson(response, "Khong the tai tien do nguoi dung");
}
