const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false // Reduzir logs para melhor legibilidade
  }
);

async function fixAllIndexes() {
  try {
    console.log('🔍 Verificando todas as tabelas...');
    
    // Obter lista de todas as tabelas
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    console.log(`📊 Encontradas ${tableNames.length} tabelas`);
    
    for (const tableName of tableNames) {
      console.log(`\n🔧 Processando tabela: ${tableName}`);
      
      try {
        // Verificar índices da tabela
        const [indexes] = await sequelize.query(`SHOW INDEX FROM \`${tableName}\``);
        
        // Agrupar por nome do índice
        const indexGroups = {};
        indexes.forEach(index => {
          if (!indexGroups[index.Key_name]) {
            indexGroups[index.Key_name] = [];
          }
          indexGroups[index.Key_name].push(index);
        });
        
        console.log(`   📋 ${Object.keys(indexGroups).length} índices encontrados`);
        
        // Identificar índices duplicados (exceto PRIMARY)
        const indexesToRemove = [];
        const seenColumns = new Set();
        
        Object.keys(indexGroups).forEach(indexName => {
          if (indexName === 'PRIMARY') return;
          
          const columns = indexGroups[indexName].map(idx => idx.Column_name).sort().join(',');
          
          if (seenColumns.has(columns)) {
            indexesToRemove.push(indexName);
          } else {
            seenColumns.add(columns);
          }
        });
        
        // Remover índices duplicados
        for (const indexName of indexesToRemove) {
          try {
            console.log(`   🗑️ Removendo índice duplicado: ${indexName}`);
            await sequelize.query(`DROP INDEX \`${indexName}\` ON \`${tableName}\``);
          } catch (error) {
            console.log(`   ⚠️ Erro ao remover ${indexName}:`, error.message);
          }
        }
        
        if (indexesToRemove.length > 0) {
          console.log(`   ✅ ${indexesToRemove.length} índices duplicados removidos`);
        } else {
          console.log(`   ✅ Nenhum índice duplicado encontrado`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao processar ${tableName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Correção de índices concluída para todas as tabelas!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await sequelize.close();
  }
}

fixAllIndexes();