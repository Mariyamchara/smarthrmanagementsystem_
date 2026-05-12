CREATE DEFINER=`root`@`%` PROCEDURE `AddSalaryIncrement`(
    IN p_employeeId VARCHAR(255),
    IN p_employeeCode VARCHAR(255),
    IN p_employeeName VARCHAR(255),
    IN p_department VARCHAR(255),
    IN p_currentSalary DECIMAL(10,2),
    IN p_proposedSalary DECIMAL(10,2),
    IN p_incrementPercentage DECIMAL(5,2),
    IN p_incrementDate DATETIME,
    IN p_reviewedBy VARCHAR(255),
    IN p_note TEXT
)
BEGIN
    INSERT INTO salary_increments
    (
    employeeId,employeeCode,employeeName,
    department,currentSalary,proposedSalary,
    incrementPercentage,incrementDate,status,
    reviewedBy,note,createdAt,updatedAt
    )
    VALUES
    (
    p_employeeId,p_employeeCode,p_employeeName,
    p_department,p_currentSalary,p_proposedSalary,
    p_incrementPercentage,p_incrementDate,
    'Pending Approval',
    p_reviewedBy,p_note,NOW(),NOW()
    );
END