import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const Leave = sequelize.define('Leave', {
  employeeId: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  toDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
  },
  reason: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  attachmentName: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  tableName: 'leaves',
  timestamps: true,
});

export default Leave;
