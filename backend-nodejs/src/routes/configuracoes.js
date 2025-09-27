const express = require('express');
const router = express.Router();
const { ConfiguracaoUsuario, ConfiguracaoAlerta, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Obter configurações do usuário
router.get('/usuario', authenticate, asyncHandler(async (req, res) => {
  let configuracao = await ConfiguracaoUsuario.findOne({
    where: { usuario_id: req.user.id }
  });

  // Se não existe, criar com valores padrão
  if (!configuracao) {
    configuracao = await ConfiguracaoUsuario.create({
      usuario_id: req.user.id
    });
  }

  res.json(configuracao);
}));

// Atualizar configurações do usuário
router.put('/usuario', authenticate, validate(schemas.updateConfiguracaoUsuario), asyncHandler(async (req, res) => {
  let configuracao = await ConfiguracaoUsuario.findOne({
    where: { usuario_id: req.user.id }
  });

  if (!configuracao) {
    // Criar nova configuração
    configuracao = await ConfiguracaoUsuario.create({
      ...req.body,
      usuario_id: req.user.id
    });
  } else {
    // Atualizar configuração existente
    await configuracao.update(req.body);
  }

  logger.business('Configurações do usuário atualizadas', { 
    usuarioId: req.user.id 
  });

  res.json(configuracao);
}));

// Obter configurações de alerta
router.get('/alertas', authenticate, asyncHandler(async (req, res) => {
  let configuracao = await ConfiguracaoAlerta.findOne({
    where: { usuario_id: req.user.id }
  });

  // Se não existe, criar com valores padrão
  if (!configuracao) {
    configuracao = await ConfiguracaoAlerta.create({
      usuario_id: req.user.id
    });
  }

  res.json(configuracao);
}));

// Atualizar configurações de alerta
router.put('/alertas', authenticate, validate(schemas.updateConfiguracaoAlerta), asyncHandler(async (req, res) => {
  let configuracao = await ConfiguracaoAlerta.findOne({
    where: { usuario_id: req.user.id }
  });

  if (!configuracao) {
    // Criar nova configuração
    configuracao = await ConfiguracaoAlerta.create({
      ...req.body,
      usuario_id: req.user.id
    });
  } else {
    // Atualizar configuração existente
    await configuracao.update(req.body);
  }

  logger.business('Configurações de alerta atualizadas', { 
    usuarioId: req.user.id 
  });

  res.json(configuracao);
}));

// Resetar configurações do usuário para padrão
router.post('/usuario/reset', authenticate, asyncHandler(async (req, res) => {
  const configuracao = await ConfiguracaoUsuario.findOne({
    where: { usuario_id: req.user.id }
  });

  if (configuracao) {
    await configuracao.update({
      tema: 'claro',
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notificacoes_email: true,
      notificacoes_push: true,
      formato_data: 'DD/MM/YYYY',
      formato_moeda: 'BRL'
    });
  } else {
    await ConfiguracaoUsuario.create({
      usuario_id: req.user.id
    });
  }

  logger.business('Configurações do usuário resetadas', { 
    usuarioId: req.user.id 
  });

  res.json({ message: 'Configurações resetadas para o padrão' });
}));

// Resetar configurações de alerta para padrão
router.post('/alertas/reset', authenticate, asyncHandler(async (req, res) => {
  const configuracao = await ConfiguracaoAlerta.findOne({
    where: { usuario_id: req.user.id }
  });

  if (configuracao) {
    await configuracao.update({
      dias_aviso_vencimento: 30,
      alerta_estoque_baixo: true,
      alerta_produto_vencendo: true,
      alerta_produto_vencido: true
    });
  } else {
    await ConfiguracaoAlerta.create({
      usuario_id: req.user.id
    });
  }

  logger.business('Configurações de alerta resetadas', { 
    usuarioId: req.user.id 
  });

  res.json({ message: 'Configurações de alerta resetadas para o padrão' });
}));

// Obter todas as configurações do usuário
router.get('/completas', authenticate, asyncHandler(async (req, res) => {
  let configuracaoUsuario = await ConfiguracaoUsuario.findOne({
    where: { usuario_id: req.user.id }
  });

  let configuracaoAlerta = await ConfiguracaoAlerta.findOne({
    where: { usuario_id: req.user.id }
  });

  // Criar configurações padrão se não existirem
  if (!configuracaoUsuario) {
    configuracaoUsuario = await ConfiguracaoUsuario.create({
      usuario_id: req.user.id
    });
  }

  if (!configuracaoAlerta) {
    configuracaoAlerta = await ConfiguracaoAlerta.create({
      usuario_id: req.user.id
    });
  }

  res.json({
    usuario: configuracaoUsuario,
    alertas: configuracaoAlerta
  });
}));

// Exportar configurações
router.get('/exportar', authenticate, asyncHandler(async (req, res) => {
  const configuracaoUsuario = await ConfiguracaoUsuario.findOne({
    where: { usuario_id: req.user.id }
  });

  const configuracaoAlerta = await ConfiguracaoAlerta.findOne({
    where: { usuario_id: req.user.id }
  });

  const configuracoes = {
    usuario: configuracaoUsuario || {},
    alertas: configuracaoAlerta || {},
    exportado_em: new Date().toISOString(),
    versao: '1.0'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=configuracoes.json');
  res.json(configuracoes);
}));

// Importar configurações
router.post('/importar', authenticate, asyncHandler(async (req, res) => {
  const { usuario, alertas } = req.body;

  if (!usuario && !alertas) {
    return res.status(400).json({ error: 'Dados de configuração inválidos' });
  }

  const resultados = {};

  // Importar configurações do usuário
  if (usuario) {
    let configuracaoUsuario = await ConfiguracaoUsuario.findOne({
      where: { usuario_id: req.user.id }
    });

    const dadosUsuario = { ...usuario, usuario_id: req.user.id };
    delete dadosUsuario.id;
    delete dadosUsuario.data_criacao;
    delete dadosUsuario.data_atualizacao;

    if (configuracaoUsuario) {
      await configuracaoUsuario.update(dadosUsuario);
    } else {
      configuracaoUsuario = await ConfiguracaoUsuario.create(dadosUsuario);
    }

    resultados.usuario = configuracaoUsuario;
  }

  // Importar configurações de alerta
  if (alertas) {
    let configuracaoAlerta = await ConfiguracaoAlerta.findOne({
      where: { usuario_id: req.user.id }
    });

    const dadosAlerta = { ...alertas, usuario_id: req.user.id };
    delete dadosAlerta.id;
    delete dadosAlerta.data_criacao;
    delete dadosAlerta.data_atualizacao;

    if (configuracaoAlerta) {
      await configuracaoAlerta.update(dadosAlerta);
    } else {
      configuracaoAlerta = await ConfiguracaoAlerta.create(dadosAlerta);
    }

    resultados.alertas = configuracaoAlerta;
  }

  logger.business('Configurações importadas', { 
    usuarioId: req.user.id,
    tiposImportados: Object.keys(resultados)
  });

  res.json({
    message: 'Configurações importadas com sucesso',
    configuracoes: resultados
  });
}));

module.exports = router;