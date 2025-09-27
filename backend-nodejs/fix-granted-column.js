const { sequelize } = require('./src/models');

async function fixGrantedColumn() {
  try {
    console.log('🔧 Verificando e adicionando coluna granted...\n');

    // Verificar se a coluna granted existe
    const [columns] = await sequelize.query("DESCRIBE UserPermissions");
    const hasGranted = columns.some(col => col.Field === 'granted');
    
    console.log('📋 Estrutura atual da UserPermissions:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    if (!hasGranted) {
      console.log('\n🔧 Adicionando coluna granted...');
      await sequelize.query(`
        ALTER TABLE UserPermissions 
        ADD COLUMN granted BOOLEAN NOT NULL DEFAULT 1 
        COMMENT 'true = permissão concedida, false = permissão negada'
      `);
      console.log('✅ Coluna granted adicionada com sucesso');
    } else {
      console.log('\n✅ Coluna granted já existe');
    }

    // Verificar estrutura atualizada
    const [updatedColumns] = await sequelize.query("DESCRIBE UserPermissions");
    console.log('\n📋 Estrutura atualizada:');
    updatedColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar se há dados na tabela
    const [count] = await sequelize.query("SELECT COUNT(*) as total FROM UserPermissions");
    console.log(`\n📊 Total de registros na UserPermissions: ${count[0].total}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixGrantedColumn();