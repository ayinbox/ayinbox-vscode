import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AyInboxProvider,
  DEFAULT_SERVER_URL,
  SECRET_KEY,
  isApiKey,
  resolveServerUrl,
} from "../src/provider.ts";

// A stand-in for the parts of the vscode module the provider touches.
class FakeEmitter {
  listeners: Array<() => void> = [];
  fired = 0;
  event = (l: () => void) => {
    this.listeners.push(l);
    return { dispose() {} };
  };
  fire() {
    this.fired++;
    for (const l of this.listeners) l();
  }
  dispose() {}
}
class FakeDef {
  label: string;
  uri: { toString(): string };
  headers: Record<string, string>;
  version?: string;
  constructor(label: string, uri: { toString(): string }, headers?: Record<string, string>, version?: string) {
    this.label = label;
    this.uri = uri;
    this.headers = headers ?? {};
    this.version = version;
  }
}
function fakeSecrets() {
  const m = new Map<string, string>();
  return {
    m,
    get: async (k: string) => m.get(k),
    store: async (k: string, v: string) => void m.set(k, v),
    delete: async (k: string) => void m.delete(k),
    keys: async () => [...m.keys()],
    onDidChange: () => ({ dispose() {} }),
  };
}
function make(url?: string) {
  const secrets = fakeSecrets();
  const p = new AyInboxProvider({
    Uri: { parse: (v: string) => ({ toString: () => v }) },
    McpHttpServerDefinition: FakeDef,
    EventEmitter: FakeEmitter,
    secrets,
    serverUrl: () => url,
  } as never);
  return { p, secrets };
}

test("default definition uses the hosted URL and no header", async () => {
  const { p } = make();
  const [d] = (await p.provideMcpServerDefinitions()) as unknown as FakeDef[];
  assert.equal(d.label, "AY Inbox");
  assert.equal(d.uri.toString(), DEFAULT_SERVER_URL);
  const r = (await p.resolveMcpServerDefinition(d as never)) as unknown as FakeDef;
  assert.equal(r.headers.Authorization, undefined);
});

test("a stored key resolves to a bearer header", async () => {
  const { p, secrets } = make();
  await p.setApiKey("  aybox_abc123 ");
  assert.equal(secrets.m.get(SECRET_KEY), "aybox_abc123");
  const [d] = await p.provideMcpServerDefinitions();
  const r = (await p.resolveMcpServerDefinition(d)) as unknown as FakeDef;
  assert.equal(r.headers.Authorization, "Bearer aybox_abc123");
});

test("clearing the key returns to OAuth and drops the header", async () => {
  const { p } = make();
  await p.setApiKey("aybox_abc");
  const [d] = await p.provideMcpServerDefinitions();
  await p.resolveMcpServerDefinition(d);
  await p.clearApiKey();
  const r = (await p.resolveMcpServerDefinition(d)) as unknown as FakeDef;
  assert.equal(r.headers.Authorization, undefined);
});

test("credential changes fire the change event and bump the version", async () => {
  const { p } = make();
  let n = 0;
  p.onDidChangeMcpServerDefinitions(() => n++);
  const [before] = (await p.provideMcpServerDefinitions()) as unknown as FakeDef[];
  await p.setApiKey("aybox_x");
  const [after] = (await p.provideMcpServerDefinitions()) as unknown as FakeDef[];
  await p.clearApiKey();
  assert.equal(n, 2);
  assert.notEqual(before.version, after.version);
});

test("serverUrl override applies only to https URLs", () => {
  assert.equal(resolveServerUrl(undefined), DEFAULT_SERVER_URL);
  assert.equal(resolveServerUrl("  "), DEFAULT_SERVER_URL);
  assert.equal(resolveServerUrl("https://example.test/v1/mcp"), "https://example.test/v1/mcp");
  assert.equal(resolveServerUrl("http://example.test/v1/mcp"), DEFAULT_SERVER_URL);
  assert.equal(resolveServerUrl("not a url"), DEFAULT_SERVER_URL);
});

test("override URL reaches the definition", async () => {
  const { p } = make("https://example.test/v1/mcp?toolsets=inbox");
  const [d] = (await p.provideMcpServerDefinitions()) as unknown as FakeDef[];
  assert.equal(d.uri.toString(), "https://example.test/v1/mcp?toolsets=inbox");
});

test("isApiKey accepts aybox_ keys only", () => {
  assert.ok(isApiKey("aybox_abc_DEF-1"));
  assert.ok(!isApiKey("ayat_abc"));
  assert.ok(!isApiKey("aybox_"));
  assert.ok(!isApiKey("Bearer aybox_abc"));
});
