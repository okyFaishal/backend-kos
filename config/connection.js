require('dotenv').config()
const { Sequelize } = require('sequelize');
// console.log(process.env)
const sequelize = new Sequelize(process.env.DB_NAME,  process.env.DB_USERNAME,  process.env.DB_PASSWORD, {
  host:  process.env.DB_HOST,
  port:  process.env.DB_PORT,

// const sequelize = new Sequelize('kos_app',  'postgres',  'Grafika9', {
//   host:  'serova.id',
//   port:  8000,
  dialect: 'postgres',
  logging: false,
  define: {
    freezeTableName: true,
    underscored: true,
  }
});

module.exports =  sequelize;