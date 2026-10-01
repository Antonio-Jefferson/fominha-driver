import { api } from "./client";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  order_id: string | null;
  read: boolean;
  created_at: string;
};

export function listNotifications(): Promise<{ notifications: NotificationItem[]; unread: number }> {
  return api.get("notifications");
}

export function markAllRead(): Promise<{ ok: boolean }> {
  return api.patch("notifications/read-all");
}
