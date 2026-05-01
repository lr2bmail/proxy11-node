const { ProxyClient } = require("../src");

async function main() {
  const client = new ProxyClient("YOUR_API_KEY");
  const rotator = await client.rotator({
    country: "us",
    proxyType: "anonymous",
    autoRefresh: true,
  });

  for (let i = 0; i < 10; i += 1) {
    console.log(await rotator.next());
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
