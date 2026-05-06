import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const Department = sequelize.define('Department', {
  _id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  dep_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
}, {
  tableName: 'departments',
  timestamps: true,
});

export default Department;
