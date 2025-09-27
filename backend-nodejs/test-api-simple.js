const http = require('http');

// Teste simples de conectividade
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test',
  method: 'GET'
};

console.log('🧪 Testando conectividade com a API...');

const req = http.request(options, (res) => {
  console.log(`✅ API respondeu com status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Resposta:', data);
    console.log('🎉 API está funcionando!');
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro ao conectar com a API: ${e.message}`);
});

req.end();