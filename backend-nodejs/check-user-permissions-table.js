const { sequelize } = require('./src/models');

async function checkUserPermissionsTable() {
  try {
    console.log('🔍 Verificando tabela UserPermissions...');
    
    // Verificar se a tabela existe
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'UserPermissions'
    `);
    
    if (results.length === 0) {
      console.log('❌ Tabela UserPermissions não existe');
      
      // Criar a tabela
      console.log('🔧 Criando tabela UserPermissions...');
      await sequelize.query(`
        CREATE TABLE UserPermissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          permission_id INT NOT NULL,
          granted BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          UNIQUE KEY unique_user_permission (user_id, permission_id),
          KEY idx_user_id (user_id),
          KEY idx_permission_id (permission_id),
          KEY idx_granted (granted),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES Permissions(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabela UserPermissions criada');
    } else {
      console.log('✅ Tabela UserPermissions existe');
      
      // Mostrar estrutura da tabela
      const [columns] = await sequelize.query(`
        DESCRIBE UserPermissions
      `);
      
      console.log('\n📋 Estrutura da tabela:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkUserPermissionsTable().then(() => {
  console.log('\n✅ Verificação concluída');
  process.exit(0);
});