const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/catalogue/gokurakugai/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Chercher "chapitre" dans l'HTML
  const idx = html.toLowerCase().indexOf('chapitre');
  if (idx >= 0) {
    console.log('Context around "chapitre":');
    console.log(html.slice(Math.max(0, idx-200), idx+400));
  } else {
    console.log('"chapitre" not found');
    // Chercher tous les liens href qui ressemblent à des chapitres
    const allLinks = html.match(/href="[^"]*(?:chapter|chap|ch\.)[^"]*"/gi) || [];
    console.log('Chapter-like links:', allLinks.slice(0, 10));

    // Chercher des liens génériques non-wp
    const sushiLinks = html.match(/href="https:\/\/sushiscan\.fr\/(?!wp-|catalogue\/|genres\/)[^"]+"/gi) || [];
    console.log('Sushi non-catalogue links (first 10):', sushiLinks.slice(0, 10));
  }
}

main().catch(console.error);
