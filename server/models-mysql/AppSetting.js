import { DataTypes } from "sequelize";
import { sequelize } from "../db-mysql.js";

const AppSetting = sequelize.define(
  "AppSetting",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    tableName: "app_settings",
    timestamps: true,
  }
);

export default AppSetting;

