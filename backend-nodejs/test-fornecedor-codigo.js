const axios = require('axios');

async function testFornecedorCodigo() {
  try {
    console.log('🧪 Testando criação de fornecedor com código automático...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // 1. Fazer login
    console.log('\n1. 🔐 Fazendo login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'testuser@example.com',
      senha: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Obter empresas do usuário
    console.log('\n2. 🏢 Obtendo empresas...');
    const empresasResponse = await axios.get(`${baseURL}/empresas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const empresas = empresasResponse.data.empresas || empresasResponse.data;
    if (!empresas || empresas.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }
    
    const empresa = empresas[0];
    console.log(`✅ Empresa encontrada: ${empresa.nome} (ID: ${empresa.id})`);
    
    // 3. Criar novo fornecedor
    console.log('\n3. 🏭 Criando novo fornecedor...');
    const novoFornecedor = {
      nome: 'Fornecedor Teste Código',
      cnpj: '12345678000190',
      email: 'teste@fornecedor.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 123',
      contato: 'João Silva',
      empresa_id: empresa.id
    };
    
    const fornecedorResponse = await axios.post(`${baseURL}/fornecedores`, novoFornecedor, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const fornecedorCriado = fornecedorResponse.data;
    console.log('✅ Fornecedor criado com sucesso!');
    console.log(`📋 ID: ${fornecedorCriado.id}`);
    console.log(`🏷️ Código: ${fornecedorCriado.codigo}`);
    console.log(`📛 Nome: ${fornecedorCriado.nome}`);
    
    // 4. Listar fornecedores para verificar
    console.log('\n4. 📋 Listando fornecedores...');
    const listResponse = await axios.get(`${baseURL}/fornecedores`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const fornecedores = listResponse.data.fornecedores || listResponse.data;
    console.log(`✅ Total de fornecedores: ${fornecedores.length}`);
    
    fornecedores.forEach(f => {
      console.log(`   - ${f.codigo} | ${f.nome}`);
    });
    
    // 5. Verificar se o código foi gerado corretamente
    const fornecedorEsperado = `FOR${String(fornecedorCriado.id).padStart(6, '0')}`;
    if (fornecedorCriado.codigo === fornecedorEsperado) {
      console.log('\n🎉 SUCESSO: Código gerado corretamente!');
      console.log(`✅ Código esperado: ${fornecedorEsperado}`);
      console.log(`✅ Código gerado: ${fornecedorCriado.codigo}`);
    } else {
      console.log('\n❌ ERRO: Código não foi gerado corretamente!');
      console.log(`❌ Código esperado: ${fornecedorEsperado}`);
      console.log(`❌ Código gerado: ${fornecedorCriado.codigo}`);
    }
    
    return {
      success: true,
      fornecedor: fornecedorCriado,
      codigoCorreto: fornecedorCriado.codigo === fornecedorEsperado
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

testFornecedorCodigo().then((result) => {
  console.log('\n🎯 Teste concluído!');
  if (result.success && result.codigoCorreto) {
    console.log('🎉 SUCESSO: Funcionalidade de código automático funcionando!');
  } else {
    console.log('⚠️ ATENÇÃO: Problemas encontrados na funcionalidade.');
  }
  process.exit(0);
});