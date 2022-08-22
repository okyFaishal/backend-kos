const { DataTypes } = require("sequelize");
const sq = require("../../config/connection");

const user = sq.define(
  "user",
  {
    public: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    public_religion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    public_gender: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    image_profile: {
      type: DataTypes.STRING,
      defaultValue: 'default.jpg'
    },
    image_ktp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status_user: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    verify_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nik: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birth_place:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    birth_date:{
      type:DataTypes.DATE,
      allowNull: false,
    },
    religion:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    gender:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    emergency_name:{
      type:DataTypes.STRING,
    },
    emergency_contact:{
      type:DataTypes.STRING,
    },
    status:{
      type:DataTypes.STRING,
      allowNull: false,
    },
    name_company:{
      type:DataTypes.STRING,
    },
    name_university:{
      type:DataTypes.STRING,
    },
    major:{
      type:DataTypes.STRING,
    },
    degree:{
      type:DataTypes.STRING,
    },
    generation:{
      type:DataTypes.STRING,
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
    indexes: [
      {
        unique: true,
        fields: ['nik']
      },
      {
        unique: true,
        fields: ['email']
      }
    ],
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    paranoid: true,
    freezeTableName: true,
  }
);

module.exports = user;
