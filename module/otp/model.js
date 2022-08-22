const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const otp = sq.define(
  "otp",
  {
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    type:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    valid_until:{
      type:DataTypes.DATE,
      allowNull: false,
    },
    otp:{
      type:DataTypes.INTEGER,
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
    freezeTableName: true,
  }
);

module.exports = otp;
