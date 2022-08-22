const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const package = sq.define(
  "package",
  {
    name:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    description:{
      type:DataTypes.STRING,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    discount: {
      type: DataTypes.INTEGER,
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

module.exports = package;
