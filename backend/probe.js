const fetch = require('node-fetch');

async function test(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }
  });
  const html = await r.text();
  console.log('Status:', r.status);
  console.log('Cloudflare?', html.includes('cf-browser-verification') || html.includes('__cf_chl'));

  const re = /href="(https:\/\/sushiscan\.net\/catalogue\/[^"\/]+\/)"[^>]*title="([^"]+)"/g;
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) results.push(m[2] + ' → ' + m[1]);
  console.log('Résultats:', results.length ? results.join('\n') : 'aucun');

  // Chercher les chapitres si c'est une page manga
  const chapters = [];
  const re2 = /href="(https:\/\/sushiscan\.net\/[^"]*chapitre-([0-9]+)[^"]*)"/gi;
  while ((m = re2.exec(html)) !== null) chapters.push('Ch.' + m[2] + ' → ' + m[1]);
  if (chapters.length) console.log('Chapitres:', chapters.slice(0, 5).join('\n'));
}

// Test recherche
test('https://sushiscan.net/?s=dorohedoro').then(() => {
  // Test page manga directement
  return test('https://sushiscan.net/catalogue/dorohedoro/');
}).catch(console.error);
