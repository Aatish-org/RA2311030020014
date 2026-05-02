
export interface LogRequest {
  stack: "backend" | "frontend";
  level: "debug" | "info" | "warn" | "error" | "fatal";
  package: string;
  message: string;
}

export async function Log(
  stack: LogRequest["stack"],
  level: LogRequest["level"],
  packageName: LogRequest["package"],
  message: LogRequest["message"]
): Promise<void> {
  try {
    const response = await fetch("http://20.207.122.201/evaluation-service/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message,
      }),
    });

    if (!response.ok) {
      console.error(`Log failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Logging error:", error);
  }
}