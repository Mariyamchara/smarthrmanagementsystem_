import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const Requisition = sequelize.define('Requisition', {
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assets: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  requestDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Partially Approved', 'Rejected', 'Fulfilled'),
    defaultValue: 'Pending',
  },
}, {
  tableName: 'requisitions',
  timestamps: true,
});

export default Requisition;
