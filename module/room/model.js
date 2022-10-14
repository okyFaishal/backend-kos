const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const build = require('../build/model')

const room = sq.define(
  "room",
  {
    build_id: {
      type: DataTypes.INTEGER,
    },
    name:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    size:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
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
            fields: ['build_id', 'name']
        }
    ]
  }
);

build.hasMany(room, {
  foreignKey: 'build_id',
});
room.belongsTo(build);

module.exports = room;
