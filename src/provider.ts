import type * as vscode from "vscode";

export const PROVIDER_ID = "ayinbox.mcp";
export const SECRET_KEY = "ayinbox.apiKey";
export const DEFAULT_SERVER_URL = "https://api.ayinbox.com/v1/mcp";
export const DOCS_URL = "https://docs.ayinbox.com/api/mcp/";

export interface ProviderDeps {
  Uri: { parse(value: string): vscode.Uri };
  McpHttpServerDefinition: new (
    label: string,
    uri: vscode.Uri,
    headers?: Record<string, string>,
    version?: string,
  ) => vscode.McpHttpServerDefinition;
  EventEmitter: new () => vscode.EventEmitter<void>;
  secrets: vscode.SecretStorage;
  serverUrl(): string | undefined;
}

export function isApiKey(value: string): boolean {
  return /^aybox_[A-Za-z0-9_-]+$/.test(value.trim());
}

export function resolveServerUrl(configured: string | undefined): string {
  const value = (configured ?? "").trim();
  if (!value) return DEFAULT_SERVER_URL;
  try {
    const url = new URL(value);
    // Never send a key over plain HTTP.
    if (url.protocol !== "https:") return DEFAULT_SERVER_URL;
    return url.toString();
  } catch {
    return DEFAULT_SERVER_URL;
  }
}

export class AyInboxProvider implements vscode.McpServerDefinitionProvider<vscode.McpHttpServerDefinition> {
  private readonly deps: ProviderDeps;
  private readonly emitter: vscode.EventEmitter<void>;
  readonly onDidChangeMcpServerDefinitions: vscode.Event<void>;

  constructor(deps: ProviderDeps) {
    this.deps = deps;
    this.emitter = new deps.EventEmitter();
    this.onDidChangeMcpServerDefinitions = this.emitter.event;
  }

  refresh(): void {
    this.emitter.fire();
  }

  private async mode(): Promise<"oauth" | "key"> {
    return (await this.deps.secrets.get(SECRET_KEY)) ? "key" : "oauth";
  }

  async provideMcpServerDefinitions(): Promise<vscode.McpHttpServerDefinition[]> {
    const uri = this.deps.Uri.parse(resolveServerUrl(this.deps.serverUrl()));
    // The version changes with the credential mode so VS Code reconnects when it switches.
    return [new this.deps.McpHttpServerDefinition("AY Inbox", uri, {}, `0.1.0-${await this.mode()}`)];
  }

  async resolveMcpServerDefinition(
    server: vscode.McpHttpServerDefinition,
  ): Promise<vscode.McpHttpServerDefinition> {
    const key = await this.deps.secrets.get(SECRET_KEY);
    server.headers = key ? { ...server.headers, Authorization: `Bearer ${key}` } : { ...server.headers };
    if (!key) delete server.headers.Authorization;
    return server;
  }

  async setApiKey(key: string): Promise<void> {
    await this.deps.secrets.store(SECRET_KEY, key.trim());
    this.refresh();
  }

  async clearApiKey(): Promise<void> {
    await this.deps.secrets.delete(SECRET_KEY);
    this.refresh();
  }

  dispose(): void {
    this.emitter.dispose();
  }
}
