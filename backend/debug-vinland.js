const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
};

async function main() {
  // Test recherche vinland saga
  const r = await fetch('https://sushiscan.fr/?s=vinland+saga', { headers: HEADERS });
  const html = await r.text();

  // Regex du script fill-urls
  const re = /href="(https:\/\/sushiscan\.fr\/catalogue\/[^"\/]+\/)"[^>]*title="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    console.log('Result:', m[2], '->', m[1]);
  }

  // Test si /catalogue/vinland-saga/ retourne quelque chose utile
  const r2 = await fetch('https://sushiscan.fr/catalogue/vinland-saga/', { headers: HEADERS });
  console.log('\nStatus /catalogue/vinland-saga/:', r2.status);

  const r3 = await fetch('https://sushiscan.fr/catalogue/saga-vinland/', { headers: HEADERS });
  console.log('Status /catalogue/saga-vinland/:', r3.status);
  if (r3.ok) {
    const html3 = await r3.text();
    const re3 = /href="(https:\/\/sushiscan\.fr\/[^"]*chapitre-([0-9]+(?:\.[0-9]+)?)[^"]*)"/gi;
    let count = 0;
    while ((m = re3.exec(html3)) !== null) count++;
    console.log('Chapters found on saga-vinland:', count);
  }
}

main().catch(console.error);
