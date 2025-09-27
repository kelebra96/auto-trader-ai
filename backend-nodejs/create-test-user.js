const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    // Verificar se o usuário já existe
    const [existingUsers] = await sequelize.query(
      "SELECT id FROM users WHERE email = 'testuser@example.com'"
    );
    
    if (existingUsers.length > 0) {
      console.log('👤 Usuário testuser@example.com já existe, atualizando senha...');
      
      // Atualizar senha
      const hashedPassword = await bcrypt.hash('test123', 10);
      await sequelize.query(
        "UPDATE users SET senha = ? WHERE email = 'testuser@example.com'",
        { replacements: [hashedPassword] }
      );
      
      console.log('✅ Senha atualizada para: test123');
      
    } else {
      console.log('👤 Criando novo usuário de teste...');
      
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      await sequelize.query(`
        INSERT INTO users (email, senha, nome_estabelecimento, papel, ativo, createdAt, updatedAt) 
        VALUES ('testuser@example.com', ?, 'Estabelecimento Teste', 'admin', 1, NOW(), NOW())
      `, { replacements: [hashedPassword] });
      
      console.log('✅ Usuário criado: testuser@example.com / test123');
    }
    
    console.log('\n🎯 Use estas credenciais para teste:');
    console.log('   Email: testuser@example.com');
    console.log('   Senha: test123');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error.message);
  } finally {
    await sequelize.close();
  }
}

createTestUser();