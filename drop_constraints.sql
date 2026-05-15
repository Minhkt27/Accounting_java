USE accounting_db;
GO

DECLARE @sql NVARCHAR(MAX) = '';

-- 1. Tìm và xóa các Check Constraints
SELECT @sql += 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + ']; '
FROM sys.check_constraints;

-- 2. Tìm và xóa các Default Constraints
SELECT @sql += 'ALTER TABLE [' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + ']; '
FROM sys.default_constraints;

-- 3. Thực thi lệnh
IF @sql <> ''
BEGIN
    EXEC sp_executesql @sql;
    PRINT 'Đã xóa tất cả các ràng buộc cũ để cập nhật BigDecimal.';
END
ELSE
BEGIN
    PRINT 'Không tìm thấy ràng buộc nào cần xóa.';
END
GO
