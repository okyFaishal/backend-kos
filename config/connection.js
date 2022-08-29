require('dotenv').config()
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME,  process.env.DB_USERNAME,  process.env.DB_PASSWORD, {
  host:  process.env.DB_HOST,
  port:  process.env.PORT,
  dialect: 'postgres',
  define: {
    freezeTableName: true,
    underscored: true,
  }
});

module.exports =  sequelize;