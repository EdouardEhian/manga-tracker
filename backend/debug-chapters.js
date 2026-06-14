const fetch = require('node-fetch');

async function test() {
  const r = await fetch('https://sushiscan.fr/catalogue/vinland-saga/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9',
      'Referer': 'https://sushiscan.fr/',
    }
  });
  console.log('Status:', r.status);
  const html = await r.text();
  console.log('HTML length:', html.length);
  console.log('Cloudflare?', html.includes('cf-browser-verification') || html.includes('__cf_chl'));

  // Chercher les chapitres avec l'ancienne regex
  const re1 = /href="(https:\/\/sushiscan\.fr\/[^"]*chapitre-([0-9]+(?:\.[0-9]+)?)[^"]*)"/gi;
  let m, count = 0;
  while ((m = re1.exec(html)) !== null) count++;
  console.log('Regex chapitre count:', count);

  // Chercher n'importe quel lien href dans l'HTML
  const links = html.match(/href="https:\/\/sushiscan[^"]+"/g) || [];
  console.log('Total sushiscan links:', links.length);
  console.log('Sample links:', links.slice(0, 5));

  // Afficher un extrait de l'HTML
  const idx = html.indexOf('chapitre');
  if (idx > 0) {
    console.log('Found "chapitre" at index', idx);
    console.log('Context:', html.slice(Math.max(0, idx-100), idx+200));
  } else {
    console.log('"chapitre" not found in HTML');
    console.log('First 500 chars:', html.slice(0, 500));
  }
}

test().catch(console.error);
