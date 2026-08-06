import type { ModelProvider } from "@/ai/provider";

export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    if (this.providers.has(provider.name)) throw new Error(`Provider already registered: ${provider.name}`);
    this.providers.set(provider.name, provider);
  }

  get(name: string): ModelProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`No provider registered with name: ${name}`);
    return provider;
  }
}
