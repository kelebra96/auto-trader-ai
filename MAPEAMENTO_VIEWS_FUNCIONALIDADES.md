# Mapeamento Completo de Views e Funcionalidades

## 📱 PÁGINAS PRINCIPAIS (VIEWS)

### 1. **Dashboard** (`/dashboard`)
- **Permissão Base**: `view_dashboard`
- **Funcionalidades**:
  - Visualizar estatísticas gerais
  - Ver produtos recentes
  - Ver alertas de vencimento
  - Ver gráficos de estoque
  - Adicionar produtos rápidos

### 2. **Produtos** (`/produtos`)
- **Permissão Base**: `view_products`
- **Funcionalidades**:
  - `products_view` - Visualizar lista de produtos
  - `products_create` - Criar novos produtos
  - `products_edit` - Editar produtos existentes
  - `products_delete` - Deletar produtos
  - `products_import` - Importar produtos via arquivo
  - `products_export` - Exportar lista de produtos
  - `products_search` - Buscar e filtrar produtos
  - `products_categories` - Gerenciar categorias

### 3. **Fornecedores** (`/fornecedores`)
- **Permissão Base**: `view_suppliers`
- **Funcionalidades**:
  - `suppliers_view` - Visualizar lista de fornecedores
  - `suppliers_create` - Criar novos fornecedores
  - `suppliers_edit` - Editar fornecedores existentes
  - `suppliers_delete` - Deletar fornecedores
  - `suppliers_search` - Buscar fornecedores

### 4. **Empresas** (`/empresas`)
- **Permissão Base**: `view_companies`
- **Funcionalidades**:
  - `companies_view` - Visualizar lista de empresas
  - `companies_create` - Criar novas empresas
  - `companies_edit` - Editar empresas existentes
  - `companies_delete` - Deletar empresas
  - `companies_search` - Buscar empresas

### 5. **Usuários** (`/usuarios`)
- **Permissão Base**: `view_all_users`
- **Funcionalidades**:
  - `users_view` - Visualizar lista de usuários
  - `users_create` - Criar novos usuários
  - `users_edit` - Editar usuários existentes
  - `users_delete` - Deletar usuários
  - `users_permissions` - Gerenciar permissões de usuários
  - `users_activate` - Ativar/desativar usuários
  - `users_reset_password` - Resetar senhas

### 6. **Alertas** (`/alertas`)
- **Permissão Base**: `view_alerts`
- **Funcionalidades**:
  - `alerts_view` - Visualizar alertas
  - `alerts_mark_read` - Marcar alertas como lidos
  - `alerts_generate` - Gerar alertas automáticos
  - `alerts_config` - Configurar alertas
  - `alerts_delete` - Deletar alertas

### 7. **Relatórios** (`/relatorios`)
- **Permissão Base**: `view_reports`
- **Funcionalidades**:
  - `reports_validades` - Relatório de validades
  - `reports_perdas` - Relatório de perdas
  - `reports_estoque` - Relatório de estoque
  - `reports_vendas` - Relatório de vendas
  - `reports_fornecedores` - Relatório de fornecedores
  - `reports_export_pdf` - Exportar relatórios em PDF
  - `reports_export_excel` - Exportar relatórios em Excel

### 8. **Configurações** (`/configuracoes`)
- **Permissão Base**: `admin` (apenas admin)
- **Funcionalidades**:
  - `settings_general` - Configurações gerais
  - `settings_notifications` - Configurações de notificações
  - `settings_security` - Configurações de segurança
  - `settings_email` - Configurações de email
  - `settings_backup` - Configurações de backup
  - `settings_export_data` - Exportar dados do sistema
  - `settings_import_data` - Importar dados do sistema

### 9. **Perfil** (`/perfil`)
- **Permissão Base**: Acesso próprio (sem restrição)
- **Funcionalidades**:
  - `profile_view` - Visualizar próprio perfil
  - `profile_edit` - Editar próprio perfil
  - `profile_change_password` - Alterar própria senha

### 10. **Mobile Dashboard** (`/mobile`)
- **Permissão Base**: `view_dashboard`
- **Funcionalidades**:
  - `mobile_dashboard` - Dashboard mobile
  - `mobile_scanner` - Scanner de código de barras

## 🔐 ESTRUTURA DE PERMISSÕES GRANULARES

### **Categorias de Permissões**

#### 1. **Dashboard**
- `dashboard_view` - Visualizar dashboard
- `dashboard_stats` - Ver estatísticas
- `dashboard_charts` - Ver gráficos

#### 2. **Produtos**
- `products_view` - Visualizar produtos
- `products_create` - Criar produtos
- `products_edit` - Editar produtos
- `products_delete` - Deletar produtos
- `products_import` - Importar produtos
- `products_export` - Exportar produtos
- `products_manage_categories` - Gerenciar categorias

#### 3. **Fornecedores**
- `suppliers_view` - Visualizar fornecedores
- `suppliers_create` - Criar fornecedores
- `suppliers_edit` - Editar fornecedores
- `suppliers_delete` - Deletar fornecedores

#### 4. **Empresas**
- `companies_view` - Visualizar empresas
- `companies_create` - Criar empresas
- `companies_edit` - Editar empresas
- `companies_delete` - Deletar empresas

#### 5. **Usuários**
- `users_view` - Visualizar usuários
- `users_create` - Criar usuários
- `users_edit` - Editar usuários
- `users_delete` - Deletar usuários
- `users_manage_permissions` - Gerenciar permissões
- `users_activate_deactivate` - Ativar/desativar usuários

#### 6. **Alertas**
- `alerts_view` - Visualizar alertas
- `alerts_manage` - Gerenciar alertas
- `alerts_configure` - Configurar alertas

#### 7. **Relatórios**
- `reports_view` - Visualizar relatórios
- `reports_generate` - Gerar relatórios
- `reports_export` - Exportar relatórios

#### 8. **Configurações**
- `settings_general` - Configurações gerais
- `settings_security` - Configurações de segurança
- `settings_notifications` - Configurações de notificações
- `settings_backup` - Configurações de backup
- `settings_system` - Configurações do sistema

#### 9. **Sistema**
- `system_admin` - Administração total do sistema
- `system_backup` - Backup do sistema
- `system_logs` - Visualizar logs do sistema

## 📋 PERFIS DE USUÁRIO SUGERIDOS

### **1. Super Admin**
- Todas as permissões (`all`)

### **2. Administrador**
- Todas exceto `system_admin`

### **3. Gerente**
- `dashboard_*`, `products_*`, `suppliers_*`, `companies_*`, `alerts_*`, `reports_*`
- `users_view`, `users_edit` (limitado)

### **4. Operador**
- `dashboard_view`, `products_view`, `products_edit`, `alerts_view`, `suppliers_view`

### **5. Visualizador**
- `dashboard_view`, `products_view`, `suppliers_view`, `companies_view`, `alerts_view`, `reports_view`

## 🎯 IMPLEMENTAÇÃO SUGERIDA

1. **Tabela de Permissões** - Armazenar todas as permissões disponíveis
2. **Tabela de Perfis** - Perfis pré-definidos com conjuntos de permissões
3. **Tabela de Usuário-Permissões** - Permissões específicas por usuário
4. **Middleware de Verificação** - Verificar permissões em cada rota/ação
5. **Interface de Gerenciamento** - Tela para administrar permissões por usuário