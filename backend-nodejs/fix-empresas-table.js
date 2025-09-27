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

async function fixEmpresasTable() {
  try {
    console.log('🔍 Verificando tabela empresas...');
    
    // Verificar índices existentes
    const [indexes] = await sequelize.query('SHOW INDEX FROM empresas');
    console.log(`📊 Total de índices encontrados: ${indexes.length}`);
    
    // Listar todos os índices
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });
    
    console.log('\n📋 Índices existentes:');
    Object.keys(indexGroups).forEach(indexName => {
      console.log(`   - ${indexName}`);
    });
    
    // Remover TODOS os índices exceto PRIMARY
    console.log('\n🧹 Removendo todos os índices (exceto PRIMARY)...');
    
    for (const indexName of Object.keys(indexGroups)) {
      if (indexName !== 'PRIMARY') {
        try {
          console.log(`   Removendo índice: ${indexName}`);
          await sequelize.query(`DROP INDEX \`${indexName}\` ON empresas`);
          console.log(`   ✅ Índice ${indexName} removido`);
        } catch (error) {
          console.log(`   ⚠️ Erro ao remover ${indexName}:`, error.message);
        }
      }
    }
    
    // Recriar apenas os índices necessários
    console.log('\n📧 Recriando índices necessários...');
    
    try {
      await sequelize.query('ALTER TABLE empresas ADD UNIQUE INDEX empresas_cnpj_unique (cnpj)');
      console.log('✅ Índice único para CNPJ criado');
    } catch (error) {
      console.log('⚠️ Erro ao criar índice de CNPJ:', error.message);
    }
    
    // Verificar resultado final
    const [finalIndexes] = await sequelize.query('SHOW INDEX FROM empresas');
    console.log(`\n🎉 Total final de índices: ${finalIndexes.length}`);
    
    console.log('\n✅ Correção da tabela empresas concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela empresas:', error);
  } finally {
    await sequelize.close();
  }
}

fixEmpresasTable();