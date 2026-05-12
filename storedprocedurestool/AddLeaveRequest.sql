CREATE DEFINER=`root`@`%` PROCEDURE `AddLeaveRequest`(
    IN p_employeeId VARCHAR(255),
    IN p_employeeName VARCHAR(255),
    IN p_department VARCHAR(255),
    IN p_type VARCHAR(255),
    IN p_fromDate DATETIME,
    IN p_toDate DATETIME,
    IN p_days INT,
    IN p_status VARCHAR(255),
    IN p_reason TEXT
)
BEGIN
    INSERT INTO leaves
    (
    employeeId,employeeName,department,type,
    fromDate,toDate,days,status,reason,
    attachmentName,createdAt,updatedAt
    )
    VALUES
    (
    p_employeeId,p_employeeName,p_department,p_type,
    p_fromDate,p_toDate,p_days,p_status,p_reason,
    NULL,NOW(),NOW()
    );
END