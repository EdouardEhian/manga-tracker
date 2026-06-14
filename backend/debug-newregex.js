const fetch = require('node-fetch');

async function getChapters(mangaUrl) {
  const r = await fetch(mangaUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Nouvelle regex : li data-num + href
  const re = /<li[^>]+data-num="([0-9]+(?:\.[0-9]+)?)"[^>]*>[\s\S]*?<a href="(https:\/\/sushiscan\.fr\/[^"]+)"/g;
  const chapters = []; const seen = new Set();
  let m;
  while ((m = re.exec(html)) !== null) {
    const num = parseFloat(m[1]);
    const url = m[2].split('?')[0].replace(/\/?$/, '/');
    if (!seen.has(url)) { seen.add(url); chapters.push({ number: num, url }); }
  }
  chapters.sort((a, b) => a.number - b.number);
  return chapters;
}

async function main() {
  const ch1 = await getChapters('https://sushiscan.fr/catalogue/gokurakugai/');
  console.log('Gokurakugai chapters:', ch1.length);
  if (ch1.length > 0) console.log('First:', ch1[0], 'Last:', ch1[ch1.length-1]);

  const ch2 = await getChapters('https://sushiscan.fr/catalogue/saga-vinland/');
  console.log('Vinland Saga chapters:', ch2.length);
  if (ch2.length > 0) console.log('First:', ch2[0], 'Last:', ch2[ch2.length-1]);
}

main().catch(console.error);
