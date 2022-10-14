const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const build = sq.define(
  "build",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address:{
      type:DataTypes.STRING,
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
    indexes: [
        {
            unique: true,
            fields: ['name', 'address']
        }
    ]
  }
);

module.exports = build;
