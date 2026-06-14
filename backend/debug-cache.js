const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/wp-content/cache/gov-cache/ajax/624b7353a726f2a10f14c260e5bb4811.json', {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
  });
  console.log('Status:', r.status);
  const text = await r.text();
  console.log('First 1000 chars:', text.slice(0, 1000));
}

main().catch(console.error);
