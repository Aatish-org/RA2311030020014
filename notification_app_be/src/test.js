// notification_app_be/src/test.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function Log(stack, level, pkg, msg) {
  console.log(`[${level.toUpperCase()}] ${pkg}: ${msg}`);
}

function calculatePriority(notification, currentTime) {
  const notifTime = new Date(notification.Timestamp);
  const timeDiffMinutes = (currentTime.getTime() - notifTime.getTime()) / (1000 * 60);
  const recency = Math.max(0, 100 - timeDiffMinutes);

  const typeWeights = { "Result": 3, "Placement": 2, "Event": 1 };
  const placementValues = { "Result": 2, "Placement": 3, "Event": 1 };

  const weight = typeWeights[notification.Type] || 1;
  const placement = placementValues[notification.Type] || 1;

  return (weight * placement) + recency;
}

function getPriorityInbox(notifications, topN = 10) {
  const currentTime = new Date();

  const prioritized = notifications.map((notif) => ({
    ...notif,
    priority: calculatePriority(notif, currentTime),
    isRead: false
  }));

  return prioritized
    .sort((a, b) => b.priority - a.priority)
    .slice(0, topN);
}

async function fetchNotifications(accessToken) {
  const response = await fetch("http://20.207.122.201/evaluation-service/notifications", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.notifications || [];
}

async function getPrioritizedNotifications(accessToken, topN = 10) {
  const notifications = await fetchNotifications(accessToken);
  return getPriorityInbox(notifications, topN);
}

async function testStage1() {
  console.log("\n========================================");
  console.log("STAGE 1: Priority Inbox Algorithm Test");
  console.log("========================================\n");

  try {
    const accessToken = process.env.ACCESS_TOKEN || "YOUR_ACCESS_TOKEN_HERE";

    if (accessToken === "YOUR_ACCESS_TOKEN_HERE") {
      console.error("❌ ERROR: Please set ACCESS_TOKEN environment variable");
      return;
    }

    console.log("📝 Starting test with access token...\n");
    await Log("backend", "info", "test", "Starting Stage 1 test");

    console.log("Test 1: Fetching Top 10 Prioritized Notifications");
    console.log("-".repeat(50));

    const top10 = await getPrioritizedNotifications(accessToken, 10);
    console.log(`✅ Successfully fetched ${top10.length} notifications\n`);

    console.table(top10.map((n, index) => ({
      Rank: index + 1,
      ID: n.ID.substring(0, 8) + "...",
      Type: n.Type,
      Priority: n.priority.toFixed(2),
      Message: n.Message.substring(0, 30),
    })));

    console.log("\n\nTest 2: Fetching Top 20 Prioritized Notifications");
    console.log("-".repeat(50));

    const top20 = await getPrioritizedNotifications(accessToken, 20);
    console.log(`✅ Successfully fetched ${top20.length} notifications\n`);

    console.log("Test 3: Priority Distribution Analysis");
    console.log("-".repeat(50));

    const typeCount = {};
    top20.forEach(n => {
      typeCount[n.Type] = (typeCount[n.Type] || 0) + 1;
    });

    console.table(typeCount);

    console.log("\nTest 4: Exporting Results");
    console.log("-".repeat(50));

    const fs = require("fs");
    const exportData = {
      testDate: new Date().toISOString(),
      totalFetched: top10.length,
      notifications: top10.map((n) => ({
        id: n.ID,
        type: n.Type,
        message: n.Message,
        priority: parseFloat(n.priority.toFixed(2)),
        timestamp: n.Timestamp,
      })),
    };

    fs.writeFileSync("stage1_test_results.json", JSON.stringify(exportData, null, 2));
    console.log(`✅ Results exported to stage1_test_results.json\n`);

    console.log("========================================");
    console.log("✅ Stage 1 Test Completed Successfully");
    console.log("========================================\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

testStage1().then(() => {
  process.exit(0);
});