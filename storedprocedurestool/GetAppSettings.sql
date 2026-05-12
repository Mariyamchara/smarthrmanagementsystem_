CREATE DEFINER=`root`@`%` PROCEDURE `GetAppSettings`()
BEGIN
    SELECT 
        setting_key,
        setting_value,
        created_at,
        updated_at
    FROM appsettings;
END