const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");
const user = require("../user/model")

const otp = sq.define(
  "otp",
  {
    user_id: {
      type: DataTypes.INTEGER,
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

user.hasMany(otp, {
  foreignKey: 'user_id',
});
otp.belongsTo(user);

module.exports = otp;
