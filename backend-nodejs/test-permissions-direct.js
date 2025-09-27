const PermissionService = require('./src/services/permissionService');

async function testPermissionsDirectly() {
  try {
    console.log('🔍 Testando getUserPermissions diretamente...');

    // Testar com o usuário ID 2 (testuser@example.com)
    const userId = 2;
    console.log(`👤 Testando com usuário ID: ${userId}`);

    const result = await PermissionService.getUserPermissions(userId);
    
    console.log('✅ Permissões obtidas com sucesso:');
    console.log('📋 Resultado completo:', JSON.stringify(result, null, 2));
    console.log('📋 Quantidade de permissões:', result.permissions ? result.permissions.length : 0);
    console.log('👤 Perfil:', result.profile);
    console.log('🎭 Papel:', result.role);
    
    if (result.permissions && result.permissions.length > 0) {
      console.log('\n📝 Permissões encontradas:');
      result.permissions.forEach((permName, index) => {
        console.log(`${index + 1}. ${permName}`);
      });
    } else {
      console.log('⚠️ Nenhuma permissão encontrada para este usuário');
    }

  } catch (error) {
    console.error('❌ Erro ao obter permissões:');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPermissionsDirectly();