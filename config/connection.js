const { Sequelize } = require('sequelize');

const sequelize = new Sequelize("kos", "postgres", "postgres", {
  host: "127.0.0.1",
  port: 5432,
  dialect: 'postgres',
  define: {
    freezeTableName: true,
    underscored: true,
  }
});

module.exports =  sequelize;