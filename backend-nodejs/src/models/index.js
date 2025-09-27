const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');
const { logger } = require('../middleware/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Criar instância do Sequelize
const sequelizeOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  dialectOptions: dbConfig.dialectOptions,
  pool: dbConfig.pool,
  logging: dbConfig.logging,
  define: dbConfig.define
};

// Adicionar storage para SQLite
if (dbConfig.storage) {
  sequelizeOptions.storage = dbConfig.storage;
}

// Adicionar timezone apenas para MySQL
if (dbConfig.dialect === 'mysql' && dbConfig.dialectOptions?.timezone) {
  sequelizeOptions.timezone = dbConfig.dialectOptions.timezone;
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  sequelizeOptions
);

// Import models
const User = require('./User')(sequelize, DataTypes);
const Empresa = require('./Empresa')(sequelize, DataTypes);
const Fornecedor = require('./Fornecedor')(sequelize, DataTypes);
const Produto = require('./Produto')(sequelize, DataTypes);
const EntradaProduto = require('./EntradaProduto')(sequelize, DataTypes);
const Alerta = require('./Alerta')(sequelize, DataTypes);
const ConfiguracaoAlerta = require('./ConfiguracaoAlerta')(sequelize, DataTypes);
const Venda = require('./Venda')(sequelize, DataTypes);
const ConfiguracaoUsuario = require('./ConfiguracaoUsuario')(sequelize, DataTypes);
const Permission = require('./Permission')(sequelize, DataTypes);
const UserProfile = require('./UserProfile')(sequelize, DataTypes);
const ProfilePermission = require('./ProfilePermission')(sequelize, DataTypes);
const UserPermission = require('./UserPermission')(sequelize, DataTypes);

// Definir associações
const models = {
  User,
  Empresa,
  Fornecedor,
  Produto,
  EntradaProduto,
  Alerta,
  ConfiguracaoAlerta,
  Venda,
  ConfiguracaoUsuario,
  Permission,
  UserProfile,
  ProfilePermission,
  UserPermission
};

// Configurar associações
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Adicionar sequelize e Sequelize aos modelos
models.sequelize = sequelize;
models.Sequelize = Sequelize;

// Função para testar conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.db('Conexão com banco de dados estabelecida com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao conectar com banco de dados:', error);
    return false;
  }
};

// Função para sincronizar modelos
const syncModels = async (options = {}) => {
  try {
    await sequelize.sync(options);
    logger.db('Modelos sincronizados com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao sincronizar modelos:', error);
    return false;
  }
};

module.exports = {
  ...models,
  testConnection,
  syncModels
};