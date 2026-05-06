import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';
import { hashPassword, isHashedPassword } from "../utils/password.js";

const Employee = sequelize.define('Employee', {
  employeeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  dob: {
    type: DataTypes.DATE,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
  },
  marital: {
    type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
  },
  designation: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
    defaultValue: "",
  },
  manager: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
  department: {
    type: DataTypes.STRING,
    references: {
      model: 'departments',
      key: '_id',
    },
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  allowance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  password: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Manager', 'Employee'),
    defaultValue: 'Employee',
  },
  image: {
    type: DataTypes.TEXT("long"),
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      darkMode: false,
      emailNotifications: true,
      smsAlerts: false,
    },
  },
}, {
  tableName: 'employees',
  timestamps: true,
  hooks: {
    beforeSave: async (employee) => {
      if (!employee?.changed?.("password")) {
        return;
      }

      const rawPassword = employee.get("password");
      if (typeof rawPassword !== "string" || rawPassword.length === 0) {
        return;
      }

      if (isHashedPassword(rawPassword)) {
        return;
      }

      employee.set("password", await hashPassword(rawPassword));
    },
  },
});

export default Employee;
