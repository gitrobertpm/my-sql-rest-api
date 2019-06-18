'use strict';

module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        notEmpty: {
          msg: "Please enter a course title"
        }
      }
    },
    description:{
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
      validate: {
        notEmpty: {
          msg: "Please enter a course description"
        }
      }
    },
    estimatedTime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    materialsNeeded: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Course.associate = (models) => {
   // TODO Add associations. Creates foreign key
   Course.belongsTo(models.User, {
    as: 'creator',
    foreignKey: {
      fieldName: 'userId',
      allowNull: false,
    },
  });
  };

  return Course;
};