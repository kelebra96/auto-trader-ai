const { sequelize } = require('./src/models');

async function forceFixGranted() {
  try {
    console.log('🔧 Forçando correção da coluna granted...');

    // 1. Verificar se a coluna existe
    const [columns] = await sequelize.query("DESCRIBE UserPermissions");
    const grantedColumn = columns.find(col => col.Field === 'granted');
    
    if (!grantedColumn) {
      console.log('➕ Adicionando coluna granted...');
      await sequelize.query(`
        ALTER TABLE UserPermissions 
        ADD COLUMN granted BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'true = permissão concedida, false = permissão negada (override do perfil)'
      `);
      console.log('✅ Coluna granted adicionada');
    } else {
      console.log('✅ Coluna granted já existe');
    }

    // 2. Verificar estrutura final
    const [finalColumns] = await sequelize.query("DESCRIBE UserPermissions");
    console.log('\n📋 Estrutura final da tabela UserPermissions:');
    finalColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Default ? `DEFAULT ${column.Default}` : ''}`);
    });

    // 3. Testar uma consulta simples
    console.log('\n🔍 Testando consulta simples...');
    const [testResult] = await sequelize.query("SELECT * FROM UserPermissions LIMIT 1");
    console.log('✅ Consulta funcionou, registros encontrados:', testResult.length);

    // 4. Testar consulta com JOIN
    console.log('\n🔍 Testando consulta com JOIN...');
    const [joinResult] = await sequelize.query(`
      SELECT u.id, u.email, up.granted, p.name as permission_name
      FROM users u
      LEFT JOIN UserPermissions up ON u.id = up.user_id
      LEFT JOIN Permissions p ON up.permission_id = p.id
      WHERE u.id = 2
      LIMIT 5
    `);
    console.log('✅ JOIN funcionou, registros encontrados:', joinResult.length);
    
    if (joinResult.length > 0) {
      console.log('📋 Dados encontrados:');
      joinResult.forEach(row => {
        console.log(`- User: ${row.email}, Permission: ${row.permission_name}, Granted: ${row.granted}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

forceFixGranted();