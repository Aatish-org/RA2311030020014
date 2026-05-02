
import { Log } from "logging_middleware/logger";

interface Notification {
  ID: string;
  Type: "Result" | "Placement" | "Event";
  Message: string;
  Timestamp: string;
}

interface PrioritizedNotification extends Notification {
  priority: number;
  isRead: boolean;
}

const typeWeights: Record<string, number> = {
  "Result": 3,
  "Placement": 2,
  "Event": 1
};

const placementValues: Record<string, number> = {
  "Result": 2,
  "Placement": 3,
  "Event": 1
};

export function calculatePriority(
  notification: Notification,
  currentTime: Date
): number {
  try {
    const notifTime = new Date(notification.Timestamp);
    const timeDiffMinutes = (currentTime.getTime() - notifTime.getTime()) / (1000 * 60);
    
    const recency = Math.max(0, 100 - timeDiffMinutes);
    
    const weight = typeWeights[notification.Type] || 1;
    const placement = placementValues[notification.Type] || 1;
    
    const priority = (weight * placement) + recency;
    
    Log("backend", "info", "priorityCalculator", 
      `Calculated priority for ${notification.ID}: ${priority}`);
    
    return priority;
  } catch (error) {
    Log("backend", "error", "priorityCalculator", 
      `Error calculating priority: ${String(error)}`);
    return 0;
  }
}

export function getPriorityInbox(
  notifications: Notification[],
  topN: number = 10
): PrioritizedNotification[] {
  try {
    const currentTime = new Date();
    
    const prioritized = notifications.map((notif) => ({
      ...notif,
      priority: calculatePriority(notif, currentTime),
      isRead: false
    }));
    
    const topNotifications = prioritized
      .sort((a, b) => b.priority - a.priority)
      .slice(0, topN);
    
    Log("backend", "info", "priorityCalculator", 
      `Retrieved top ${topN} notifications from ${notifications.length} total`);
    
    return topNotifications;
  } catch (error) {
    Log("backend", "error", "priorityCalculator", 
      `Error in getPriorityInbox: ${String(error)}`);
    return [];
  }
}

export type { Notification, PrioritizedNotification };