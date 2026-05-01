const fs = require("node:fs/promises");

const BASE_URL = "https://proxy11.com/api/proxy.json";

class Proxy11Error extends Error {
  constructor(message) {
    super(message);
    this.name = "Proxy11Error";
  }
}

class APIError extends Proxy11Error {
  constructor(message) {
    super(message);
    this.name = "APIError";
  }
}

class NoProxiesError extends Proxy11Error {
  constructor(message) {
    super(message);
    this.name = "NoProxiesError";
  }
}

class ProxyClient {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Proxy11Error("API key is required");
    }
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl || BASE_URL;
    this.timeout = options.timeout || 10000;
    this.fetch = options.fetch || globalThis.fetch;
    if (typeof this.fetch !== "function") {
      throw new Proxy11Error("fetch is required. Use Node 18+ or pass options.fetch.");
    }
  }

  async get(options = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.set("key", this.apiKey);
    if (options.limit !== undefined) {
      url.searchParams.set("limit", String(Number.parseInt(options.limit, 10)));
    }
    if (options.country !== undefined) {
      url.searchParams.set("country", options.country);
    }
    if (options.proxyType !== undefined) {
      url.searchParams.set("type", options.proxyType);
    }
    if (options.type !== undefined) {
      url.searchParams.set("type", options.type);
    }
    if (options.speed !== undefined) {
      url.searchParams.set("speed", String(Number.parseFloat(options.speed)));
    }
    if (options.port !== undefined) {
      url.searchParams.set("port", String(Number.parseInt(options.port, 10)));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    let response;
    try {
      response = await this.fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new APIError("API request timed out");
      }
      throw new APIError(error && error.message ? error.message : "API request failed");
    } finally {
      clearTimeout(timeoutId);
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new APIError("API returned invalid JSON");
    }

    if (!response.ok) {
      const message = data && data.msg ? data.msg : response.statusText;
      throw new APIError(`API error ${response.status}: ${message}`);
    }
    if (data && data.error) {
      throw new APIError(data.msg || "API error");
    }
    if (!Array.isArray(data)) {
      throw new APIError("API returned unexpected data");
    }
    return data;
  }

  async asList(options = {}) {
    const proxies = await this.get(options);
    return proxies
      .filter((proxy) => proxy && proxy.ip && proxy.port)
      .map((proxy) => `${proxy.ip}:${proxy.port}`);
  }

  async random(options = {}) {
    const proxies = await this.asList({ limit: 100, ...options });
    if (!proxies.length) {
      throw new NoProxiesError("No proxies available");
    }
    return proxies[Math.floor(Math.random() * proxies.length)];
  }

  async randomProxy(options = {}) {
    const proxies = await this.get({ limit: 100, ...options });
    if (!proxies.length) {
      throw new NoProxiesError("No proxies available");
    }
    return proxies[Math.floor(Math.random() * proxies.length)];
  }

  async save(path, options = {}) {
    const proxies = await this.asList(options);
    if (!proxies.length) {
      return 0;
    }
    await fs.writeFile(path, `${proxies.join("\n")}\n`);
    return proxies.length;
  }

  rotator(options = {}) {
    const { onFail = null, autoRefresh = false, refreshAfter = 10, ...filters } = options;
    return ProxyRotator.create(this, { onFail, autoRefresh, refreshAfter, filters });
  }
}

class ProxyRotator {
  constructor(client, options) {
    this.client = client;
    this.onFail = options.onFail;
    this.autoRefresh = options.autoRefresh;
    this.refreshAfter = options.refreshAfter;
    this.filters = options.filters;
    this.pool = [];
    this.index = 0;
    this.count = 0;
  }

  static async create(client, options) {
    const rotator = new ProxyRotator(client, options);
    await rotator.refresh();
    return rotator;
  }

  async refresh() {
    this.pool = await this.client.asList({ limit: 200, ...this.filters });
    shuffle(this.pool);
    this.index = 0;
    this.count = 0;
  }

  async next() {
    if (!this.pool.length) {
      if (this.autoRefresh) {
        await this.refresh();
      }
      if (!this.pool.length) {
        throw new NoProxiesError("No proxies available");
      }
    }

    if (this.refreshAfter && this.count >= this.refreshAfter) {
      await this.refresh();
      if (!this.pool.length) {
        throw new NoProxiesError("No proxies available");
      }
    }

    const proxy = this.pool[this.index % this.pool.length];
    this.index += 1;
    this.count += 1;
    return proxy;
  }

  markDead(proxy) {
    this.pool = this.pool.filter((item) => item !== proxy);
    if (this.onFail) {
      this.onFail(proxy);
    }
  }

  get remaining() {
    return this.pool.length;
  }
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

module.exports = {
  APIError,
  BASE_URL,
  NoProxiesError,
  Proxy11Error,
  ProxyClient,
  ProxyRotator,
};
