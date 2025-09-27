const jwt = require('jsonwebtoken');
require('dotenv').config();

// Simular o token que foi gerado
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZXN0dXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTc1OTAwNzgyMSwiZXhwIjoxNzU5NjEyNjIxfQ.DqaoTos6R7fAipQwyukEM-csZ4tZgWrvO27KEubifWc";

console.log('🔍 Testando validação do token...');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Presente' : 'Ausente');

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ Token válido!');
  console.log('📋 Dados decodificados:', decoded);
} catch (error) {
  console.log('❌ Token inválido:', error.message);
  console.log('🔍 Tipo do erro:', error.name);
}