import React, { useState } from 'react';

const TestLogin = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testando...');

    try {
      console.log('Iniciando teste de login...');
      console.log('URL da API:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000/api' 
        : `http://${window.location.hostname}:5000/api`);

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setResult(`✅ Login bem-sucedido!\nUsuário: ${data.usuario.email}\nToken: ${data.token.substring(0, 50)}...`);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
      } else {
        setResult(`❌ Erro: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      setResult(`❌ Erro de conexão: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithAxios = async () => {
    setLoading(true);
    setResult('Testando com Axios...');

    try {
      const { authService } = await import('../services/api');
      const result = await authService.login(email, password);
      setResult(`✅ Login com Axios bem-sucedido!\nUsuário: ${result.user.email}\nToken: ${result.token.substring(0, 50)}...`);
    } catch (error) {
      console.error('Erro no teste com Axios:', error);
      setResult(`❌ Erro com Axios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Teste de Login</h2>
      
      <div style={{ marginBottom: '10px' }}>
        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '5px 0' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label>Senha:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', margin: '5px 0' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testando...' : 'Testar com Fetch'}
        </button>

        <button 
          onClick={testWithAxios} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testando...' : 'Testar com Axios'}
        </button>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace'
      }}>
        {result || 'Clique em um dos botões para testar o login'}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Usuários disponíveis:</h3>
        <ul>
          <li>admin@example.com - admin123</li>
          <li>gerente@example.com - gerente123</li>
          <li>usuario@example.com - usuario123</li>
          <li>visualizador@example.com - visualizador123</li>
          <li>teste@teste.com - teste123</li>
        </ul>
      </div>
    </div>
  );
};

export default TestLogin;