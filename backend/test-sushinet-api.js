const fetch = require('node-fetch');

async function test() {
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };

  console.log('Test WP REST API...');
  try {
    const r = await fetch('https://sushiscan.net/wp-json/wp/v2/posts?slug=dorohedoro&per_page=1&_fields=id,slug,title', { headers: HEADERS });
    console.log('Status:', r.status);
    const text = await r.text();
    console.log('Body (100 chars):', text.slice(0, 200));
  } catch(e) {
    console.log('Error:', e.message);
  }
}

test();
