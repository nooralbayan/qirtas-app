const https = require('https');

const data = JSON.stringify({ secret: 'qirtas_setup_2025' });

const options = {
  hostname: 'nooralbayan.onrender.com',
  port: 443,
  path: '/api/auth/setup-viewer',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
