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
    birth_place: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    birth_date: {
      type:DataTypes.DATE,
      allowNull: false,
    },
    religion: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    emergency_name: {
      type:DataTypes.STRING,
    },
    emergency_contact: {
      type:DataTypes.STRING,
    },
    status: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    name_company: {
      type:DataTypes.STRING,
    },
    name_university: {
      type:DataTypes.STRING,
    },
    major: {
      type:DataTypes.STRING,
    },
    degree: {
      type:DataTypes.STRING,
    },
    generation: {
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
      },
      {
        unique: true,
        fields: ['contact']
      }
    ],
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    freezeTableName: true,
  }
);
// async function start(){
//   try {
//     let dataUser = await user.findAll({where: {status_user: true}})
//     console.log(dataUser)
//     if(dataUser.length == 0) dataUser = await user.create({
//       public: true,
//       public_religion: false,
//       public_gender: false,
//       image_profile: 'default.jpg',
//       image_ktp: 'default.jpg',
//       status_user: true,
//       username: 'admin',
//       email: 'admin@gmail.com',
//       verify_email: false,
//       contact: 123456123456,
//       password: 'admin',
//       nik: 1234567812345678,
//       birth_place: 'admin',
//       birth_date: new Date(),
//       religion: 'admin',
//       gender: 'admin',
//       status: 'admin',
//     })
//   console.log(dataUser)
//   dataUser instanceof user 
//   } catch (error) {
//     console.log("error")
//     console.log(error)
//   }
// }
// start()
module.exports = user;
