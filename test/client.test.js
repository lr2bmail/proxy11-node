const assert = require("node:assert/strict");
const { test } = require("node:test");

const { APIError, NoProxiesError, Proxy11Error, ProxyClient } = require("../src");

function fakeResponse(body, options = {}) {
  return {
    ok: options.ok !== false,
    status: options.status || 200,
    statusText: options.statusText || "OK",
    async json() {
      if (body instanceof Error) {
        throw body;
      }
      return body;
    },
  };
}

test("get sends expected API parameters", async () => {
  let requestedUrl;
  const client = new ProxyClient("key", {
    baseUrl: "https://example.test/api/proxy.json",
    fetch: async (url) => {
      requestedUrl = url;
      return fakeResponse([{ ip: "1.1.1.1", port: "80" }]);
    },
  });

  const proxies = await client.get({
    limit: 10,
    country: "us",
    proxyType: "anonymous",
    speed: 1.5,
    port: 8080,
  });

  assert.equal(proxies.length, 1);
  assert.equal(requestedUrl.searchParams.get("key"), "key");
  assert.equal(requestedUrl.searchParams.get("limit"), "10");
  assert.equal(requestedUrl.searchParams.get("country"), "us");
  assert.equal(requestedUrl.searchParams.get("type"), "anonymous");
  assert.equal(requestedUrl.searchParams.get("speed"), "1.5");
  assert.equal(requestedUrl.searchParams.get("port"), "8080");
});

test("get raises APIError for error payload", async () => {
  const client = new ProxyClient("key", {
    fetch: async () => fakeResponse({ error: true, msg: "bad key" }),
  });

  await assert.rejects(() => client.get(), { name: "APIError", message: "bad key" });
});

test("asList skips malformed proxy rows", async () => {
  const client = new ProxyClient("key", {
    fetch: async () => fakeResponse([
      { ip: "1.1.1.1", port: "80" },
      { ip: "2.2.2.2" },
      null,
    ]),
  });

  assert.deepEqual(await client.asList(), ["1.1.1.1:80"]);
});

test("random raises when no proxies are available", async () => {
  const client = new ProxyClient("key", {
    fetch: async () => fakeResponse([]),
  });

  await assert.rejects(() => client.random(), { name: "NoProxiesError" });
});

test("rotator uses default limit when not provided", async () => {
  const calls = [];
  const client = {
    async asList(options) {
      calls.push(options);
      return ["1.1.1.1:80", "2.2.2.2:8080"];
    },
  };

  const rotator = await ProxyClient.prototype.rotator.call(client, { country: "us" });
  const proxy = await rotator.next();

  assert.ok(["1.1.1.1:80", "2.2.2.2:8080"].includes(proxy));
  assert.deepEqual(calls, [{ limit: 200, country: "us" }]);
});

test("rotator raises when refresh returns no proxies", async () => {
  const calls = [];
  const client = {
    async asList(options) {
      calls.push(options);
      return calls.length === 1 ? ["1.1.1.1:80"] : [];
    },
  };

  const rotator = await ProxyClient.prototype.rotator.call(client, { limit: 10, refreshAfter: 1 });

  assert.equal(await rotator.next(), "1.1.1.1:80");
  await assert.rejects(() => rotator.next(), { name: "NoProxiesError" });
});

test("client errors inherit from Error", () => {
  assert.ok(new APIError("x") instanceof Proxy11Error);
  assert.ok(new NoProxiesError("x") instanceof Proxy11Error);
  assert.ok(new Proxy11Error("x") instanceof Error);
});
