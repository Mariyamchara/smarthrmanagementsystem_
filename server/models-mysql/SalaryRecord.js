import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';

const SalaryRecord = sequelize.define('SalaryRecord', {
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  presentDays: {
    type: DataTypes.INTEGER,
    defaultValue: 22,
  },
  absentDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  basic: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  allowance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  deduction: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  netSalary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Processed',
  },
  processedBy: {
    type: DataTypes.STRING,
    defaultValue: 'Admin',
  },
  processedOn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  periodFrom: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  periodTo: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'salary_records',
  timestamps: true,
});

export default SalaryRecord;
