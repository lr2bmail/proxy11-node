# proxy11

Lightweight Node.js client for the [Proxy11](https://proxy11.com) proxy API.

## Install

```bash
npm install proxy11
```

## Quick Start

```js
const { ProxyClient } = require("proxy11");

const client = new ProxyClient("YOUR_API_KEY");
```

`Proxy11Error`, `APIError`, and `NoProxiesError` are exported if you want to catch client-specific errors.

## Get Proxies

```js
const proxies = await client.get();

const usProxies = await client.get({
  limit: 50,
  country: "us",
  proxyType: "anonymous",
  speed: 1.0,
});
```

## Get `ip:port` List

```js
const proxies = await client.asList({ limit: 50 });
// ["103.152.112.166:8080", "45.77.56.114:4145"]
```

## Random Proxy

```js
const proxy = await client.random({ country: "us" });
// "103.152.112.166:8080"

const proxyDetails = await client.randomProxy();
// { ip: "103.152.112.166", port: "8080", country: "Indonesia", ... }
```

## Save to File

```js
const count = await client.save("proxies.txt", { country: "us" });
console.log(`saved ${count} proxies`);
```

## Rotator

Cycle through proxies with optional auto-refresh and dead-proxy removal.

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

console.log(`${rotator.remaining} proxies left in pool`);
```

## Parameters

| Parameter   | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| `limit`     | number | Max proxies to return (free: 50, ultimate: 5000) |
| `country`   | string | Filter by country name or code                   |
| `port`      | number | Filter by port number                            |
| `speed`     | number | Max response time in seconds                     |
| `proxyType` | string | `anonymous` or `transparent`                     |

## API Key

Get a free API key at [proxy11.com](https://proxy11.com/newaccount).

- **Free plan**: 50 proxies per request
- **Ultimate plan**: 5,000 proxies per request, from $12

## License

MIT
