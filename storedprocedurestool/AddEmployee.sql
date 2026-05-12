CREATE DEFINER=`root`@`%` PROCEDURE `AddEmployee`(
    IN p_employeeId VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_dob DATETIME,
    IN p_gender VARCHAR(50),
    IN p_marital VARCHAR(50),
    IN p_designation VARCHAR(255),
    IN p_department VARCHAR(255),
    IN p_salary DECIMAL(10,2),
    IN p_allowance DECIMAL(10,2),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(50)
)
BEGIN
    INSERT INTO employees
    (
    employeeId,name,email,dob,gender,marital,
    designation,department,salary,allowance,
    password,isActive,leftAt,role,image,
    createdAt,updatedAt
    )
    VALUES
    (
    p_employeeId,p_name,p_email,p_dob,p_gender,p_marital,
    p_designation,p_department,p_salary,p_allowance,
    p_password,1,NULL,p_role,NULL,
    NOW(),NOW()
    );
END