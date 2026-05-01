const { ProxyClient } = require("../src");

async function main() {
  const client = new ProxyClient("YOUR_API_KEY");
  const count = await client.save("proxies.txt", { limit: 100, country: "us" });
  console.log(`saved ${count} proxies`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
