

const response = await fetch('https://transpordiamet.ee/ohusoidukite-register', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
    },
});

const body = await response.arrayBuffer();
const enc = new TextDecoder('utf-8');
const data = enc.decode(body);

console.log('Writing data.html...');
await Deno.writeTextFile('./data.html', data);
