const { ProxyClient } = require("../src");

async function main() {
  const client = new ProxyClient("YOUR_API_KEY");
  const proxies = await client.get({ limit: 10, country: "us" });
  console.log(proxies);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
