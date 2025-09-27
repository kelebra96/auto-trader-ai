const { Sequelize } = require('sequelize');
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

async function checkUsers() {
  try {
    console.log('🔍 Verificando estrutura da tabela users...');
    
    const [columns] = await sequelize.query('DESCRIBE users');
    console.log('📋 Colunas da tabela users:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n👥 Verificando usuários no banco de dados...');
    
    const [users] = await sequelize.query('SELECT * FROM users LIMIT 3');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      
      // Criar um usuário de teste
      console.log('\n🔧 Criando usuário de teste...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      // Usar as colunas que realmente existem
      await sequelize.query(`
        INSERT INTO users (email, password, name, role, active, created_at, updated_at) 
        VALUES ('test@test.com', '${hashedPassword}', 'Usuário Teste', 'admin', 1, NOW(), NOW())
      `);
      
      console.log('✅ Usuário de teste criado: test@test.com / test123');
      
    } else {
      console.log(`✅ ${users.length} usuário(s) encontrado(s):`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - ${user.name || user.nome} (${user.role || user.papel})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();