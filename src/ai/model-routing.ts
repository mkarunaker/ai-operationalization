import routing from "../../config/model-routing.json";
import type { AgentRole } from "@/domain/roles";

type Provider = "openai" | "zenmux";
type ModelTier = keyof typeof routing.tiers;

export function configuredModel(provider: Provider, role: AgentRole): string {
  const tier = routing.roleDefaults[role] as ModelTier;
  return routing.tiers[tier][provider];
}

export { routing as modelRoutingPolicy };
