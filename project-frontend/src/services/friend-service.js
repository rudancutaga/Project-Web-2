import { apiFetch } from "@/services/api-client";
import { parseJson } from "@/services/service-utils";

export async function getFriends() {
  const response = await apiFetch("/social/friends");
  return parseJson(response, "Khong the tai danh sach ban be");
}

export async function sendFriendRequest(userId) {
  const response = await apiFetch(`/social/friends/${userId}/request`, {
    method: "POST",
  });
  return parseJson(response, "Khong the gui loi moi ket ban");
}

export async function acceptFriendRequest(userId) {
  const response = await apiFetch(`/social/friends/${userId}/accept`, {
    method: "POST",
  });
  return parseJson(response, "Khong the chap nhan loi moi");
}
