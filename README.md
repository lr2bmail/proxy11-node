# proxy11

[![npm](https://img.shields.io/npm/v/proxy11.svg)](https://www.npmjs.com/package/proxy11)
[![Node](https://img.shields.io/node/v/proxy11.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Official Node.js client for the [Proxy11](https://proxy11.com) proxy API.

Use it to fetch fresh proxy lists, filter by country or anonymity type, rotate through proxies, and export simple `ip:port` files.

## Install

```bash
npm install proxy11
```

## Quick Start

```js
const { ProxyClient } = require("proxy11");

const client = new ProxyClient("YOUR_API_KEY");

const proxies = await client.get({ limit: 50, country: "us" });
const proxy = await client.random({ proxyType: "anonymous" });
const proxyList = await client.asList({ limit: 100 });
```

## Examples

### Get Proxies

```js
const proxies = await client.get({
  limit: 50,
  country: "us",
  proxyType: "anonymous",
  speed: 1.0,
});
```

### Get `ip:port` List

```js
const proxies = await client.asList({ limit: 50 });
// ["103.152.112.166:8080", "45.77.56.114:4145"]
```

### Random Proxy

```js
const proxy = await client.random({ country: "us" });
const proxyDetails = await client.randomProxy();
```

### Save to File

```js
const count = await client.save("proxies.txt", { country: "us" });
console.log(`saved ${count} proxies`);
```

## Rotator

```js
const rotator = await client.rotator({
  country: "us",
  proxyType: "anonymous",
  autoRefresh: true,
  refreshAfter: 50,
});

for (let i = 0; i < 100; i += 1) {
  const proxy = await rotator.next();
  console.log(proxy);
  // if proxy fails:
  // rotator.markDead(proxy);
}
```

## Error Handling

```js
const { APIError, NoProxiesError, ProxyClient } = require("proxy11");

const client = new ProxyClient("YOUR_API_KEY");

try {
  const proxy = await client.random({ country: "us" });
  console.log(proxy);
} catch (error) {
  if (error instanceof NoProxiesError) {
    console.log("No proxies matched the filters");
  } else if (error instanceof APIError) {
    console.log(`Proxy11 API error: ${error.message}`);
  } else {
    throw error;
  }
}
```

## API

| Method | Description |
|--------|-------------|
| `get(filters)` | Return proxy rows as objects |
| `asList(filters)` | Return proxies as `ip:port` strings |
| `random(filters)` | Return one random `ip:port` proxy |
| `randomProxy(filters)` | Return one random proxy object |
| `save(path, filters)` | Save `ip:port` proxies to a file |
| `rotator(filters)` | Create an async proxy rotator |

## Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max proxies to return, capped by your plan |
| `country` | string | Country name or two-letter country code |
| `port` | number | Proxy port |
| `speed` | number | Max response time in seconds |
| `proxyType` | string | `anonymous` or `transparent` |

## Links

- Website: [proxy11.com](https://proxy11.com)
- API docs: [proxy11.com/apidoc](https://proxy11.com/apidoc)
- SDK page: [proxy11.com/sdk](https://proxy11.com/sdk)

## License

MIT
