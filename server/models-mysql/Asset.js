import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const Asset = sequelize.define('Asset', {
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  requisitionId: {
    type: DataTypes.STRING,
  },
  assets: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  assignedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'assets',
  timestamps: true,
});

export default Asset;
