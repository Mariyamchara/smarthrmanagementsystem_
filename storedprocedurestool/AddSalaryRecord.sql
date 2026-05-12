CREATE DEFINER=`root`@`%` PROCEDURE `AddSalaryRecord`(
    IN p_employeeId VARCHAR(255),
    IN p_employeeName VARCHAR(255),
    IN p_department VARCHAR(255),
    IN p_month INT,
    IN p_year INT,
    IN p_basic DECIMAL(10,2),
    IN p_allowance DECIMAL(10,2),
    IN p_deduction DECIMAL(10,2),
    IN p_tax DECIMAL(10,2),
    IN p_netSalary DECIMAL(10,2)
)
BEGIN
    INSERT INTO salary_records
    (
    employeeId,employeeName,department,
    month,year,basic,allowance,deduction,
    tax,netSalary,createdAt,updatedAt
    )
    VALUES
    (
    p_employeeId,p_employeeName,p_department,
    p_month,p_year,p_basic,p_allowance,p_deduction,
    p_tax,p_netSalary,NOW(),NOW()
    );
end