const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/catalogue/gokurakugai/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Chercher contexte autour de data-num="4"
  const idx = html.indexOf('data-num="4"');
  if (idx >= 0) {
    console.log('Context around data-num="4":');
    console.log(html.slice(Math.max(0, idx-200), idx+400));
  }
}

main().catch(console.error);
