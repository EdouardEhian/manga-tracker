const fetch = require('node-fetch');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/json,*/*',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  'Referer': 'https://sushiscan.fr/catalogue/gokurakugai/',
};

async function main() {
  // data-id trouvé dans la page
  const mangaId = '170095';

  const r = await fetch('https://sushiscan.fr/wp-admin/admin-ajax.php', {
    method: 'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `action=manga_get_chapters&manga=${mangaId}`,
  });

  console.log('Status:', r.status);
  const text = await r.text();
  console.log('Response (500 chars):', text.slice(0, 500));

  // Chercher des chapitres
  const re = /href="(https:\/\/sushiscan\.fr\/[^"]+)"/gi;
  const links = text.match(re) || [];
  console.log('Links found:', links.length);
  console.log('First 3:', links.slice(0, 3));
}

main().catch(console.error);
