import type { FireScenario } from "@/lib/types/types";

function parseScenarioTimestamp(value: string | undefined): number | null {
  if (!value) return null;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function selectLatestFireScenario(
  scenarios: readonly FireScenario[],
): FireScenario | null {
  let latestScenario: FireScenario | null = null;
  let latestTimestamp = Number.NEGATIVE_INFINITY;
  let foundTimestamp = false;

  scenarios.forEach((scenario) => {
    const timestamp =
      parseScenarioTimestamp(scenario.updatedAt) ??
      parseScenarioTimestamp(scenario.createdAt);

    if (timestamp === null) return;

    if (!foundTimestamp || timestamp >= latestTimestamp) {
      latestScenario = scenario;
      latestTimestamp = timestamp;
      foundTimestamp = true;
    }
  });

  if (foundTimestamp) return latestScenario;

  return scenarios.at(-1) ?? null;
}
