const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const user = require('../user/model')

const chat = sq.define(
  "chat",
  {
    user_id: {
      type: DataTypes.INTEGER,
    },
    message:{
      type:DataTypes.STRING,
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

user.hasMany(chat, {
  foreignKey: 'user_id',
  onDelete: 'SET NULL',
});
chat.belongsTo(user);

module.exports = chat;
