import { DataTypes } from 'sequelize';
import { sequelize } from '../db-mysql.js';
import { hashPassword, isHashedPassword } from "../utils/password.js";

const AdminProfile = sequelize.define('AdminProfile', {
  profileId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  title: {
    type: DataTypes.STRING,
  },
  dept: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.TEXT("long"),
  },
  password: {
    type: DataTypes.STRING,
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      employees: true,
      leaves: true,
      settings: false,
      salary: false,
    },
  },
}, {
  tableName: 'adminprofile',
  timestamps: true,
  hooks: {
    beforeSave: async (profile) => {
      if (!profile?.changed?.("password")) {
        return;
      }

      const rawPassword = profile.get("password");
      if (typeof rawPassword !== "string" || rawPassword.length === 0) {
        return;
      }

      if (isHashedPassword(rawPassword)) {
        return;
      }

      profile.set("password", await hashPassword(rawPassword));
    },
  },
});

export default AdminProfile;
