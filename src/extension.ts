import * as vscode from "vscode";
import { AyInboxProvider, DOCS_URL, PROVIDER_ID, isApiKey } from "./provider";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new AyInboxProvider({
    Uri: vscode.Uri,
    McpHttpServerDefinition: vscode.McpHttpServerDefinition,
    EventEmitter: vscode.EventEmitter,
    secrets: context.secrets,
    serverUrl: () => vscode.workspace.getConfiguration("ayinbox").get<string>("serverUrl"),
  });

  context.subscriptions.push(
    provider,
    vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, provider),
    context.secrets.onDidChange((e) => {
      if (e.key.startsWith("ayinbox.")) provider.refresh();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("ayinbox.serverUrl")) provider.refresh();
    }),
    vscode.commands.registerCommand("ayinbox.useApiKey", async () => {
      const key = await vscode.window.showInputBox({
        title: "AY Inbox API key",
        prompt: "Create a key in the AY Inbox dashboard under Settings > API keys. It is stored in VS Code's secret storage.",
        placeHolder: "aybox_...",
        password: true,
        ignoreFocusOut: true,
        validateInput: (v) => (isApiKey(v) ? undefined : "An AY Inbox API key starts with aybox_"),
      });
      if (!key) return;
      await provider.setApiKey(key);
      void vscode.window.showInformationMessage("AY Inbox now connects with your API key.");
    }),
    vscode.commands.registerCommand("ayinbox.useOAuth", async () => {
      await provider.clearApiKey();
      void vscode.window.showInformationMessage(
        "AY Inbox API key removed. VS Code will ask you to sign in the next time the server starts.",
      );
    }),
    vscode.commands.registerCommand("ayinbox.openDocs", () => vscode.env.openExternal(vscode.Uri.parse(DOCS_URL))),
  );
}

export function deactivate(): void {}
