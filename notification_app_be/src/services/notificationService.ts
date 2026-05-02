
import { Log } from "logging_middleware/logger";
import { getPriorityInbox, type Notification } from "../utils/priorityCalculator";

const NOTIFICATION_API = "http://20.207.122.201/evaluation-service/notifications";

export async function fetchNotifications(accessToken: string): Promise<Notification[]> {
  try {
    await Log("backend", "info", "notificationService", "Fetching notifications from API");

    const response = await fetch(NOTIFICATION_API, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as { notifications: Notification[] };

    if (!Array.isArray(data.notifications)) {
      throw new Error("Invalid response: notifications is not an array");
    }

    await Log("backend", "info", "notificationService",
      `Successfully fetched ${data.notifications.length} notifications`);

    return data.notifications;
  } catch (error) {
    await Log("backend", "error", "notificationService",
      `Failed to fetch notifications: ${String(error)}`);
    throw error;
  }
}

export async function getPrioritizedNotifications(
  accessToken: string,
  topN: number = 10
) {
  try {
    const notifications = await fetchNotifications(accessToken);
    const prioritized = getPriorityInbox(notifications, topN);

    await Log("backend", "info", "notificationService",
      `Returned ${prioritized.length} prioritized notifications`);

    return prioritized;
  } catch (error) {
    await Log("backend", "error", "notificationService",
      `Error getting prioritized notifications: ${String(error)}`);
    throw error;
  }
}