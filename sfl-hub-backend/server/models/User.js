import { DataTypes } from 'sequelize';

const UserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false, 
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true, 
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
    },
    createdby: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    updatedby: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    startdate: {
      type: DataTypes.DATE, 
      allowNull: true, 
    },
    enddate: {
      type: DataTypes.DATE,
      allowNull: true, 
    },
  }, {
    timestamps: true,
    createdAt: 'createdon', 
    updatedAt: 'updatedon', 
  });

  return User;
};

export { UserModel };
