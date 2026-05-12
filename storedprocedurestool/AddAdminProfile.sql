CREATE DEFINER=`root`@`%` PROCEDURE `AddAdminProfile`(
    IN p_profileId VARCHAR(255),
    IN p_name VARCHAR(255),
    IN p_username VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(255),
    IN p_title VARCHAR(255),
    IN p_dept VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_password VARCHAR(255)
)
BEGIN
    INSERT INTO adminprofile
    (
    profileId,name,username,email,phone,title,
    dept,location,image,password,permissions,
    createdAt,updatedAt
    )
    VALUES
    (
    p_profileId,p_name,p_username,p_email,p_phone,p_title,
    p_dept,p_location,NULL,p_password,
    JSON_OBJECT('access','ALL'),
    NOW(),NOW()
    );
END