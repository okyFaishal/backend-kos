const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const user = require('../user/model')
const history = require('../history/model')

const payment = sq.define(
  "payment",
  {
    user_id: {
      type: DataTypes.INTEGER,
    },
    history_id: {
      type: DataTypes.INTEGER,
    },
    pay:{
      type:DataTypes.INTEGER,
      allowNull: false,
    },
    date:{
      type:DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
    }
  },
  {
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    paranoid: true,
    freezeTableName: true,
  }
);

user.hasMany(payment, {
  foreignKey: 'user_id',
});
payment.belongsTo(user);

history.hasMany(payment, {
  foreignKey: 'history_id',
});
payment.belongsTo(history);

module.exports = payment;
