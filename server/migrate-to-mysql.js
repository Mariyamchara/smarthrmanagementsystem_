import { connectToDatabase, sequelize } from './db-mysql.js';
import Department from './models-mysql/Department.js';
import Employee from './models-mysql/Employee.js';
import AdminProfile from './models-mysql/AdminProfile.js';
import Leave from './models-mysql/Leave.js';
import Asset from './models-mysql/Asset.js';
import Requisition from './models-mysql/Requisition.js';
import SalaryRecord from './models-mysql/SalaryRecord.js';
import SalaryIncrement from './models-mysql/SalaryIncrement.js';

async function migrate() {
  try {
    await connectToDatabase();
    console.log('Creating tables...');
    await sequelize.sync({ force: false });
    console.log('✓ All tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
