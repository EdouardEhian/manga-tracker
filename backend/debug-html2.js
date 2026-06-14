const fetch = require('node-fetch');

async function main() {
  const r = await fetch('https://sushiscan.fr/catalogue/gokurakugai/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html', 'Accept-Language': 'fr-FR,fr;q=0.9' }
  });
  const html = await r.text();

  // Chercher l'ID du post / manga
  const postIdMatch = html.match(/postid["-\s:=]+(\d+)/i) || html.match(/manga[_-]?id["\s:=]+(\d+)/i) || html.match(/"post"[:\s]+"(\d+)"/);
  console.log('Post ID match:', postIdMatch?.[1]);

  // Chercher ajax URL
  const ajaxMatch = html.match(/ajaxurl["\s:=]+"([^"]+)"/);
  console.log('AJAX URL:', ajaxMatch?.[1]);

  // Chercher chapter_url ou l'API
  const apiMatch = html.match(/chapter[_-]?url["\s:=]+"([^"]+)"/i) || html.match(/series[_-]?slug["\s:=]+"([^"]+)"/i);
  console.log('API match:', apiMatch?.[1]);

  // Chercher data- attributes avec des IDs
  const dataIds = html.match(/data-id="(\d+)"/g) || [];
  console.log('data-id attrs:', dataIds.slice(0, 5));

  // Extraire 500 chars autour de "ajax"
  const ajaxIdx = html.toLowerCase().indexOf('admin-ajax');
  if (ajaxIdx >= 0) console.log('Ajax context:', html.slice(Math.max(0, ajaxIdx-100), ajaxIdx+300));
}

main().catch(console.error);
