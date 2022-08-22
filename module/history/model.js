const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const user = require('../user/model')
const room = require('../room/model')
const package = require('../package/model')

const history = sq.define(
  "history",
  {
    user_id: {
      type: DataTypes.INTEGER,
    },
    room_id: {
      type: DataTypes.INTEGER,
    },
    package_id: {
      type: DataTypes.INTEGER,
    },
    pay: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    start_kos:{
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

user.hasMany(history, {
  foreignKey: 'user_id',
  onDelete: 'SET NULL',
});
history.belongsTo(user);

room.hasMany(history, {
  foreignKey: 'room_id',
  onDelete: 'SET NULL',
});
history.belongsTo(room);

package.hasMany(history, {
  foreignKey: 'package_id',
  onDelete: 'SET NULL',
});
history.belongsTo(package);

module.exports = history;
