const { sequelize } = require('./src/models');

async function checkTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela UserPermissions...');

    // Verificar se a tabela existe
    const [results] = await sequelize.query("SHOW TABLES LIKE 'UserPermissions'");
    
    if (results.length === 0) {
      console.log('❌ Tabela UserPermissions não existe');
      return;
    }

    console.log('✅ Tabela UserPermissions existe');

    // Verificar estrutura da tabela
    const [columns] = await sequelize.query("DESCRIBE UserPermissions");
    
    console.log('\n📋 Estrutura da tabela UserPermissions:');
    columns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    // Verificar se a coluna granted existe
    const grantedColumn = columns.find(col => col.Field === 'granted');
    if (grantedColumn) {
      console.log('\n✅ Coluna "granted" existe');
    } else {
      console.log('\n❌ Coluna "granted" NÃO existe');
      
      // Adicionar a coluna granted
      console.log('\n🔧 Adicionando coluna "granted"...');
      await sequelize.query(`
        ALTER TABLE UserPermissions 
        ADD COLUMN granted BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'true = permissão concedida, false = permissão negada (override do perfil)'
      `);
      console.log('✅ Coluna "granted" adicionada com sucesso');
    }

    // Verificar dados na tabela
    const [data] = await sequelize.query("SELECT COUNT(*) as count FROM UserPermissions");
    console.log(`\n📊 Registros na tabela: ${data[0].count}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();