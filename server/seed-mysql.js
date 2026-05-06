import { connectToDatabase } from './db-mysql.js';
import Department from './models-mysql/Department.js';
import Employee from './models-mysql/Employee.js';
import AdminProfile from './models-mysql/AdminProfile.js';
import Leave from './models-mysql/Leave.js';
import SalaryRecord from './models-mysql/SalaryRecord.js';
import seedDepartments from './data/seedDepartments.js';
import seedEmployees from './data/seedEmployees.js';
import seedAdminProfile from './data/seedAdminProfile.js';

async function seed() {
  try {
    await connectToDatabase();
    console.log('Seeding data...');

    await Department.bulkCreate(seedDepartments, { ignoreDuplicates: true });
    console.log('Departments seeded');

    await Employee.bulkCreate(seedEmployees, { ignoreDuplicates: true, individualHooks: true });
    console.log('Employees seeded');

    await AdminProfile.bulkCreate(seedAdminProfile, { ignoreDuplicates: true, individualHooks: true });
    console.log('Admin profile seeded');

   
     
    

    const salaryRecordCount = await SalaryRecord.count();
    if (salaryRecordCount === 0) {
      const employees = await Employee.findAll({
        where: {
          employeeId: seedEmployees.map((employee) => employee.employeeId),
        },
      });

      const seededSalaryRecords = employees.map((employee) => {
        const basic = Number(employee.get('salary') || 0);
        const allowance = Number(employee.get('allowance') || 0);
        const deduction = Math.round(basic * 0.1);
        const tax = Math.round(basic * 0.05);

        return {
          employeeId: employee.get('employeeId'),
          employeeName: employee.get('name'),
          department: employee.get('department'),
          month: 4,
          year: 2026,
          presentDays: 22,
          absentDays: 0,
          basic,
          allowance,
          deduction,
          tax,
          netSalary: basic + allowance - deduction - tax,
          status: 'Processed',
          processedBy: 'Seed Script',
          processedOn: new Date('2026-04-28T10:00:00Z'),
          periodFrom: new Date('2026-04-01T00:00:00Z'),
          periodTo: new Date('2026-04-30T23:59:59Z'),
        };
      });

      await SalaryRecord.bulkCreate(seededSalaryRecords);
      console.log('Salary records seeded');
    } else {
      console.log('Salary records already exist, skipping seed');
    }

    console.log('All data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
