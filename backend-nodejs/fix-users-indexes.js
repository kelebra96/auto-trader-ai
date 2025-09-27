const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log
  }
);

async function fixUsersIndexes() {
  try {
    console.log('🔍 Verificando índices da tabela users...');
    
    // Verificar índices existentes
    const [indexes] = await sequelize.query('SHOW INDEX FROM users');
    console.log(`📊 Total de índices encontrados: ${indexes.length}`);
    
    // Agrupar por nome do índice
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });
    
    console.log('\n📋 Índices existentes:');
    Object.keys(indexGroups).forEach(indexName => {
      console.log(`   - ${indexName} (${indexGroups[indexName].length} colunas)`);
    });
    
    // Remover índices duplicados ou desnecessários
    console.log('\n🧹 Removendo índices duplicados...');
    
    const indexesToRemove = [];
    Object.keys(indexGroups).forEach(indexName => {
      // Manter apenas PRIMARY e um índice único para email
      if (indexName !== 'PRIMARY' && indexName.includes('email') && indexName !== 'users_email_unique') {
        indexesToRemove.push(indexName);
      }
    });
    
    for (const indexName of indexesToRemove) {
      try {
        console.log(`   Removendo índice: ${indexName}`);
        await sequelize.query(`DROP INDEX \`${indexName}\` ON users`);
        console.log(`   ✅ Índice ${indexName} removido`);
      } catch (error) {
        console.log(`   ⚠️ Erro ao remover ${indexName}:`, error.message);
      }
    }
    
    // Verificar se existe índice único para email
    const emailIndexes = Object.keys(indexGroups).filter(name => 
      name.includes('email') && name !== 'PRIMARY'
    );
    
    if (emailIndexes.length === 0) {
      console.log('\n📧 Criando índice único para email...');
      try {
        await sequelize.query('ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email)');
        console.log('✅ Índice único para email criado');
      } catch (error) {
        console.log('⚠️ Erro ao criar índice de email:', error.message);
      }
    }
    
    // Verificar resultado final
    const [finalIndexes] = await sequelize.query('SHOW INDEX FROM users');
    console.log(`\n🎉 Total final de índices: ${finalIndexes.length}`);
    
    console.log('\n✅ Correção de índices concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir índices:', error);
  } finally {
    await sequelize.close();
  }
}

fixUsersIndexes();