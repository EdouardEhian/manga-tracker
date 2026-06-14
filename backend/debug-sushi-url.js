const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
};

async function main() {
  // Tester le vrai slug
  const r = await fetch('https://sushiscan.fr/catalogue/saga-vinland/', { headers: HEADERS });
  console.log('saga-vinland status:', r.status);
  const html = await r.text();
  const re = /href="(https:\/\/sushiscan\.fr\/[^"]*chapitre-([0-9]+(?:\.[0-9]+)?)[^"]*)"/gi;
  let m, count = 0;
  while ((m = re.exec(html)) !== null) { count++; if (count <= 3) console.log('Ch:', m[2], m[1]); }
  console.log('Total chapters found:', count);
}

main().catch(console.error);
