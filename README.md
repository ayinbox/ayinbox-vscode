# AY Inbox for VS Code

Adds the AY Inbox MCP server to VS Code, so its tools appear in GitHub Copilot agent mode. There is no config file to edit.

AY Inbox is a hosted cold email platform: it sends cold email at a paced daily volume, brings every reply into one inbox (Unibox), drafts answers from a campaign brain, and can offer a meeting time from Cal.com or Calendly. With this extension, Copilot can build contact lists, draft campaigns and their brains, read replies and draft answers, and track deals.

Access to the hosted service is invite only for now: ask at [team@ayinbox.com](mailto:team@ayinbox.com).

AY Inbox is a hosted service. This repository holds the VS Code extension that connects to its MCP server. The service itself is not open source.

## What it adds

One MCP server, **AY Inbox**, at `https://api.ayinbox.com/v1/mcp` (streamable HTTP). It shows up in the Copilot Chat tools picker and in **MCP: List Servers**. Requires VS Code 1.101 or later.

## Sign in

1. Install the extension. It is not on the Visual Studio Marketplace or Open VSX yet: download `ayinbox.vsix` from a CI run of [ayinbox/ayinbox-vscode](https://github.com/ayinbox/ayinbox-vscode/actions) and run **Extensions: Install from VSIX...**.
2. Open Copilot Chat in **Agent** mode and open the tools picker, or run **MCP: List Servers** and start **AY Inbox**.
3. VS Code registers itself with AY Inbox and opens the browser. Sign in at app.ayinbox.com and approve the scopes. No key to copy.

## Use an API key instead

Run **AY Inbox: Use an API key** from the Command Palette and paste a key. Create one in the dashboard under **Settings > API keys** (it starts with `aybox_` and is shown once).

The key is stored in VS Code's secret storage (the operating system keychain), never in settings or in a file. From then on the extension sends it as `Authorization: Bearer aybox_...` and VS Code reconnects the server. **AY Inbox: Sign in with OAuth instead** deletes the stored key and returns to the browser sign-in.

## Commands and settings

| Command | What it does |
|---|---|
| AY Inbox: Use an API key | Stores a key in secret storage and connects with it |
| AY Inbox: Sign in with OAuth instead | Deletes the stored key |
| AY Inbox: Open docs | Opens the MCP server docs |

| Setting | Default | What it does |
|---|---|---|
| `ayinbox.serverUrl` | `https://api.ayinbox.com/v1/mcp` | The server URL. Must be `https`. Add `?toolsets=inbox,campaigns` to narrow the tool list for a small model |

## Tools

The server lists only the tools your credential may call. With every scope, that is 174 tools in twelve toolsets:

- `inbox`: read and sort replies, draft answers, offer meeting times
- `campaigns`: campaigns, their steps, campaign brains and auto-reply
- `contacts`: contacts, segments and the do-not-contact list
- `crm`: pipelines, deals, tasks and notes
- `forms`, `analytics`, `mailboxes`, `workspace`, `developer`, `automation`, `leads`, `research`

Ask Copilot to call `get_workspace_limits` to check it worked. It is a free read. The full table with each tool's scope is on the [MCP server docs page](https://docs.ayinbox.com/api/mcp/).

## Safety model

The tools prepare and a person sends.

- **No tool sends an individual email.** Replying, composing, booking a meeting and placement tests are not exposed over MCP, whatever the scope. Reply drafts wait for a person.
- **No tool lifts a person's stop**, approves a first email, connects a mailbox, or changes the team, workspace settings or billing.
- **Starting a campaign** takes `START_CAMPAIGNS` or `SEND_CAMPAIGNS`. A client connected with OAuth holds `START_CAMPAIGNS` only when its person ticked **Start and resume campaigns** on the consent screen.
- **Results are data.** Every tool result is fenced as untrusted content, because anyone who can email the workspace writes text the model reads.
- Every tool carries the standard annotations, so VS Code asks before a tool that changes or deletes something.

## Cursor and Windsurf

Cursor and Windsurf install extensions from [Open VSX](https://open-vsx.org), where this extension will be published under the same id (`ayinbox.ayinbox`); it is not there yet. Whether those editors read MCP servers registered by an extension depends on the editor; if the server does not appear, add it to the editor's own MCP config instead, as shown in the [`ayinbox-mcp` client configs](https://github.com/ayinbox/ayinbox-mcp#connect).

## Privacy

The extension sends no telemetry and has no runtime dependencies. It talks to nothing itself: VS Code connects to the server URL above.

## Links

- [MCP server docs](https://docs.ayinbox.com/api/mcp/)
- [OAuth 2.1](https://docs.ayinbox.com/api/oauth/)
- [Permissions](https://docs.ayinbox.com/api/permissions/)
- [Agent guide (skill.md)](https://ayinbox.com/skill.md)
- [ayinbox.com](https://ayinbox.com)

## License

MIT. Access to the AY Inbox service is separate: ask at [team@ayinbox.com](mailto:team@ayinbox.com).
