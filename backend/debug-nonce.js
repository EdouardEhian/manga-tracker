const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/catalogue/gokurakugai/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Chercher le nonce
  const nonceMatch = html.match(/nonce["\s:=]+"([a-f0-9]+)"/i)
    || html.match(/"nonce":"([a-f0-9]+)"/i)
    || html.match(/manga_get_chapters[^}]+nonce["\s:=]+"([a-f0-9]+)"/is);
  console.log('Nonce:', nonceMatch?.[1]);

  // Chercher dans les scripts inline
  const scriptMatches = html.match(/chapter_ajax_nonce["\s:=]+"([^"]+)"/i)
    || html.match(/localize_var[^<]+nonce[^<]+/i);
  console.log('Script nonce:', scriptMatches?.[0]?.slice(0, 200));

  // Dump section autour de "nonce"
  const idx = html.toLowerCase().indexOf('nonce');
  if (idx >= 0) {
    console.log('Nonce context:', html.slice(Math.max(0, idx-50), idx+200));
  }

  // data-id for chapters section
  const chapterDiv = html.match(/id="chapter[^"]*"[^>]*data-[^>]*/gi);
  console.log('Chapter divs:', chapterDiv?.slice(0, 3));
}

main().catch(console.error);
