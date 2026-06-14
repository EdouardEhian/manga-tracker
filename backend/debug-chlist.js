const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/catalogue/gokurakugai/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Chercher series-history ou chapter list
  const idx = html.indexOf('series-history');
  if (idx >= 0) console.log('series-history context:', html.slice(Math.max(0, idx-50), idx+500));

  // Chercher ts_chapter ou chapter-list
  const idx2 = html.indexOf('chapter-list');
  if (idx2 >= 0) console.log('chapter-list context:', html.slice(Math.max(0, idx2-50), idx2+500));

  // Chercher data-num ou data-chapter
  const chNums = html.match(/data-(?:num|chapter)[^>]*/gi) || [];
  console.log('data-num/chapter attrs:', chNums.slice(0, 5));

  // Chercher les li avec des hrefs
  const liLinks = html.match(/<li[^>]*>\s*<a href="[^"]*sushiscan[^"]*"[^>]*>[^<]*<\/a>/gi) || [];
  console.log('li links count:', liLinks.length);
  console.log('First 3:', liLinks.slice(0, 3));
}

main().catch(console.error);
