import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { CheckCircle, Calendar, TrendingUp, Shield, Smartphone, BarChart3, Target, Users, Zap, Award, ArrowRight, Star } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('funcionalidades')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Validade Inteligente</h1>
                <p className="text-sm text-gray-600">Gestão Inteligente de Validade</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#funcionalidades" className="text-gray-700 hover:text-green-600 transition-colors">Funcionalidades</a>
              <a href="#planos" className="text-gray-700 hover:text-green-600 transition-colors">Planos</a>
              <a href="#sobre" className="text-gray-700 hover:text-green-600 transition-colors">Sobre</a>
              <a href="#contato" className="text-gray-700 hover:text-green-600 transition-colors">Contato</a>
            </nav>
            <Button className="bg-green-600 hover:bg-green-700">
              Começar Agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">
            🚀 Reduza perdas em até 70%
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Reduza perdas, maximize lucros e
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> combata o desperdício</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A gestão de validade do futuro para pequenos e médios varejistas. 
            Inteligência artificial que não apenas alerta, mas age proativamente para evitar perdas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
              Teste Grátis por 30 Dias
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              Ver Demonstração
            </Button>
          </div>
          <div className="mt-12 flex justify-center items-center space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span>4.9/5 avaliação</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>+500 varejistas</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>R$ 2M+ economizados</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              O Problema que Você Conhece Bem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mais de 37% das perdas no varejo alimentar são por validade vencida, 
              totalizando R$ 7,6 bilhões anuais no Brasil segundo a ABRAS.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Perdas Financeiras</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Produtos vencidos representam prejuízo direto e perda de margem de lucro
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-orange-600">Riscos Legais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Multas do PROCON, apreensão de produtos e danos à reputação da empresa
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-600">Controle Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Planilhas e controles manuais são lentos, propensos a erros e ineficientes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Inteligentes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Não apenas alertamos sobre produtos próximos ao vencimento - 
              nossa IA sugere e automatiza ações para maximizar seus lucros.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Dashboard Intuitivo</CardTitle>
                <CardDescription>
                  Visualização clara dos produtos próximos ao vencimento com gráficos e indicadores
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Alertas Inteligentes</CardTitle>
                <CardDescription>
                  Notificações personalizáveis por e-mail e app sobre produtos em diferentes estágios
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>IA Preditiva</CardTitle>
                <CardDescription>
                  Sugestões automáticas de promoções, doações e ações baseadas em dados históricos
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Gamificação</CardTitle>
                <CardDescription>
                  Metas de redução de desperdício, medalhas e ranking para motivar sua equipe
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>App Mobile</CardTitle>
                <CardDescription>
                  Controle total na palma da mão com leitura de código de barras integrada
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Relatórios Completos</CardTitle>
                <CardDescription>
                  Análises detalhadas de perdas, economia gerada e insights para otimização
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Planos Acessíveis para Seu Negócio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comece gratuitamente e evolua conforme sua necessidade
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Plano Básico</CardTitle>
                <CardDescription>Ideal para começar</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">Grátis</span>
                  <span className="text-gray-600">/sempre</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Até 100 produtos</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Alertas de vencimento</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Relatórios básicos</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Suporte por email</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>
            <Card className="relative border-green-500 border-2">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-500 text-white">Mais Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Plano Pro</CardTitle>
                <CardDescription>Para maximizar resultados</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">R$ 97</span>
                  <span className="text-gray-600">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Produtos ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>IA para sugestões automáticas</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Gamificação completa</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Relatórios avançados</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Integração com PDV</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Suporte prioritário</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                  Teste 30 Dias Grátis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Reduzir Suas Perdas?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de varejistas que já economizaram milhões com o Validade Inteligente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3">
              Começar Teste Gratuito
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-3">
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Validade Inteligente</h3>
              </div>
              <p className="text-gray-400">
                Gestão inteligente de validade para o varejo alimentar do futuro.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Planos</a></li>
                <li><a href="#" className="hover:text-white">Demonstração</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Treinamentos</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Validade Inteligente. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

