import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const SalaryIncrement = sequelize.define('SalaryIncrement', {
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeCode: {
    type: DataTypes.STRING,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  currentSalary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  proposedSalary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  incrementPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  incrementDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending Approval',
  },
  reviewedBy: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  note: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
}, {
  tableName: 'salary_increments',
  timestamps: true,
});

export default SalaryIncrement;
