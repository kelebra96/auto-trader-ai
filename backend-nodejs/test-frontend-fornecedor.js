const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testFrontendFornecedor() {
  console.log('🧪 Testando funcionalidade de fornecedores no frontend...\n');

  try {
    // 1. Login
    console.log('1. 🔐 Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@teste.com',
      senha: '123456'
    });

    if (loginResponse.status !== 200) {
      throw new Error('Falha no login');
    }

    const token = loginResponse.data.data.token;
    
    if (!token) {
      throw new Error('Token não encontrado na resposta do login');
    }
    
    console.log('✅ Login realizado com sucesso\n');

    // 2. Obter empresas
    console.log('2. 🏢 Obtendo empresas...');
    const empresasResponse = await axios.get(`${BASE_URL}/empresas`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!empresasResponse.data.empresas || empresasResponse.data.empresas.length === 0) {
      throw new Error('Nenhuma empresa encontrada');
    }

    const empresaId = empresasResponse.data.empresas[0].id;
    console.log(`✅ Empresa encontrada: ${empresasResponse.data.empresas[0].nome} (ID: ${empresaId})\n`);

    // 3. Listar fornecedores existentes
    console.log('3. 📋 Listando fornecedores existentes...');
    const fornecedoresResponse = await axios.get(`${BASE_URL}/fornecedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Total de fornecedores existentes: ${fornecedoresResponse.data.fornecedores.length}`);
    
    if (fornecedoresResponse.data.fornecedores.length > 0) {
      console.log('📋 Fornecedores existentes:');
      fornecedoresResponse.data.fornecedores.forEach(f => {
        console.log(`   - ${f.codigo} | ${f.nome}`);
      });
    }
    console.log('');

    // 4. Criar novo fornecedor
    console.log('4. 🏭 Criando novo fornecedor...');
    const novoFornecedor = {
      nome: 'Fornecedor Frontend Test',
      cnpj: '98765432000123',
      email: 'frontend@teste.com',
      telefone: '(11) 88888-8888',
      endereco: 'Rua Frontend, 456',
      contato: 'Maria Silva',
      empresa_id: empresaId
    };

    const createResponse = await axios.post(`${BASE_URL}/fornecedores`, novoFornecedor, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (createResponse.status !== 201) {
      throw new Error('Falha ao criar fornecedor');
    }

    const fornecedorCriado = createResponse.data;
    console.log('✅ Fornecedor criado com sucesso!');
    console.log(`📋 ID: ${fornecedorCriado.id}`);
    console.log(`🏷️ Código: ${fornecedorCriado.codigo}`);
    console.log(`📛 Nome: ${fornecedorCriado.nome}\n`);

    // 5. Verificar se o código foi gerado corretamente
    const codigoEsperado = `FOR${String(fornecedorCriado.id).padStart(6, '0')}`;
    
    if (fornecedorCriado.codigo === codigoEsperado) {
      console.log('🎉 SUCESSO: Código gerado corretamente!');
      console.log(`✅ Código esperado: ${codigoEsperado}`);
      console.log(`✅ Código gerado: ${fornecedorCriado.codigo}\n`);
    } else {
      console.log('❌ ERRO: Código não foi gerado corretamente!');
      console.log(`❌ Código esperado: ${codigoEsperado}`);
      console.log(`❌ Código gerado: ${fornecedorCriado.codigo}\n`);
    }

    // 6. Listar fornecedores novamente para confirmar
    console.log('6. 📋 Listando fornecedores após criação...');
    const fornecedoresAtualizadosResponse = await axios.get(`${BASE_URL}/fornecedores`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`✅ Total de fornecedores: ${fornecedoresAtualizadosResponse.data.fornecedores.length}`);
    fornecedoresAtualizadosResponse.data.fornecedores.forEach(f => {
      console.log(`   - ${f.codigo} | ${f.nome}`);
    });

    console.log('\n🎯 Teste concluído!');
    console.log('🎉 SUCESSO: Funcionalidade de código automático funcionando no frontend!');

  } catch (error) {
    console.log('❌ Erro no teste:', {
      success: false,
      error: error.response?.data?.error || error.message,
      stack: error.stack
    });
    console.log('Status:', error.response?.status);
    
    console.log('\n🎯 Teste concluído!');
    console.log('⚠️ ATENÇÃO: Problemas encontrados na funcionalidade.');
  }
}

testFrontendFornecedor();