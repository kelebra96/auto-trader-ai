#!/usr/bin/env python3
"""
Script para analisar possíveis problemas no PermissionsContext
"""

import re

def analyze_permissions_context():
    """Analisa o arquivo PermissionsContext.jsx para identificar problemas"""
    
    print("🔍 ANÁLISE DO PERMISSIONSCONTEXT.JSX")
    print("=" * 60)
    
    try:
        with open('d:/auto-trader-ai/frontend/src/contexts/PermissionsContext.jsx', 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("✅ Arquivo carregado com sucesso")
        print()
        
        # 1. Verificar se a função hasPermission está correta
        print("1️⃣ Analisando função hasPermission...")
        
        has_permission_match = re.search(r'const hasPermission = \(permission\) => \{(.*?)\};', content, re.DOTALL)
        if has_permission_match:
            has_permission_code = has_permission_match.group(1).strip()
            print(f"   Código encontrado:")
            print(f"   {has_permission_code}")
            
            # Verificar se tem a lógica correta para 'all'
            if "permissions.includes('all')" in has_permission_code:
                print("   ✅ Verificação de 'all' encontrada")
            else:
                print("   ❌ Verificação de 'all' NÃO encontrada")
            
            if "return true" in has_permission_code:
                print("   ✅ Return true encontrado")
            else:
                print("   ❌ Return true NÃO encontrado")
        else:
            print("   ❌ Função hasPermission NÃO encontrada")
        
        print()
        
        # 2. Verificar função loadPermissions
        print("2️⃣ Analisando função loadPermissions...")
        
        load_permissions_match = re.search(r'const loadPermissions = async \(\) => \{(.*?)\};', content, re.DOTALL)
        if load_permissions_match:
            load_permissions_code = load_permissions_match.group(1).strip()
            print("   ✅ Função loadPermissions encontrada")
            
            # Verificar se está fazendo a chamada correta para a API
            if "/usuarios/permissoes" in load_permissions_code:
                print("   ✅ Endpoint correto encontrado")
            else:
                print("   ❌ Endpoint correto NÃO encontrado")
            
            # Verificar se está setando as permissões corretamente
            if "setPermissions(response.data.permissoes" in load_permissions_code:
                print("   ✅ SetPermissions encontrado")
            else:
                print("   ❌ SetPermissions NÃO encontrado")
            
            # Verificar tratamento de erro
            if "catch" in load_permissions_code:
                print("   ✅ Tratamento de erro encontrado")
            else:
                print("   ❌ Tratamento de erro NÃO encontrado")
        else:
            print("   ❌ Função loadPermissions NÃO encontrada")
        
        print()
        
        # 3. Verificar useEffect
        print("3️⃣ Analisando useEffect...")
        
        use_effect_matches = re.findall(r'useEffect\(\(\) => \{(.*?)\}, \[(.*?)\]\);', content, re.DOTALL)
        if use_effect_matches:
            print(f"   ✅ {len(use_effect_matches)} useEffect(s) encontrado(s)")
            
            for i, (effect_code, deps) in enumerate(use_effect_matches):
                print(f"   UseEffect {i+1}:")
                print(f"     Dependências: [{deps}]")
                if "loadPermissions" in effect_code:
                    print("     ✅ Chama loadPermissions")
                else:
                    print("     ❌ NÃO chama loadPermissions")
        else:
            print("   ❌ UseEffect NÃO encontrado")
        
        print()
        
        # 4. Verificar estado inicial
        print("4️⃣ Analisando estado inicial...")
        
        state_matches = re.findall(r'const \[(\w+), set\w+\] = useState\((.*?)\);', content)
        if state_matches:
            print("   Estados encontrados:")
            for state_name, initial_value in state_matches:
                print(f"     {state_name}: {initial_value}")
                
                if state_name == "permissions" and initial_value == "[]":
                    print("       ✅ Permissions inicializado como array vazio")
                elif state_name == "loading" and initial_value == "true":
                    print("       ✅ Loading inicializado como true")
        else:
            print("   ❌ Estados NÃO encontrados")
        
        print()
        
        # 5. Verificar funções de verificação de cargo
        print("5️⃣ Analisando funções de cargo...")
        
        role_functions = ['isAdmin', 'isGerente', 'isUsuario', 'isVisualizador']
        for func in role_functions:
            if f"const {func} = () => cargo === " in content:
                print(f"   ✅ {func} encontrada")
            else:
                print(f"   ❌ {func} NÃO encontrada")
        
        print()
        
        # 6. Verificar se o contexto está sendo exportado corretamente
        print("6️⃣ Verificando exports...")
        
        if "export const usePermissions" in content:
            print("   ✅ usePermissions exportado")
        else:
            print("   ❌ usePermissions NÃO exportado")
        
        if "export const PermissionsProvider" in content:
            print("   ✅ PermissionsProvider exportado")
        else:
            print("   ❌ PermissionsProvider NÃO exportado")
        
        print()
        
        # 7. Procurar por possíveis problemas
        print("7️⃣ Procurando possíveis problemas...")
        
        potential_issues = []
        
        # Verificar se há console.log que pode estar interferindo
        if "console.log" in content:
            console_logs = re.findall(r'console\.log\([^)]+\)', content)
            potential_issues.append(f"Console.logs encontrados: {len(console_logs)}")
        
        # Verificar se há await sem try/catch
        await_matches = re.findall(r'await [^;]+;', content)
        for await_match in await_matches:
            if "try" not in content[:content.find(await_match)]:
                potential_issues.append(f"Await sem try/catch: {await_match}")
        
        if potential_issues:
            print("   ⚠️ Possíveis problemas encontrados:")
            for issue in potential_issues:
                print(f"     - {issue}")
        else:
            print("   ✅ Nenhum problema óbvio encontrado")
        
        print()
        
        # 8. Resultado final
        print("8️⃣ RESULTADO DA ANÁLISE:")
        print("   O código do PermissionsContext parece estar correto.")
        print("   O problema pode estar em:")
        print("   1. Timing de carregamento")
        print("   2. Cache do navegador")
        print("   3. Problema na API")
        print("   4. Problema no localStorage")
        print("   5. Erro silencioso no JavaScript")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao analisar arquivo: {e}")
        return False

if __name__ == "__main__":
    analyze_permissions_context()