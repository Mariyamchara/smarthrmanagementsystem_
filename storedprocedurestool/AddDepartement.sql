CREATE DEFINER=`root`@`%` PROCEDURE `AddDepartment`(
    IN p_id VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_description TEXT
)
BEGIN
    INSERT INTO departments
    (_id, dep_name, description)
    VALUES
    (p_id, p_name, p_descriptionsp_AddAdminProfile);
END