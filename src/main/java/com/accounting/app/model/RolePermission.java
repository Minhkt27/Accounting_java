package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "role_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role_name", "function_code"})
}) // Bảng Quyền hạn vai trò
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class RolePermission extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false)
    private String roleName;        // Tên vai trò (e.g. "ROLE_NHAN_SU")

    @Column(name = "function_code", nullable = false)
    private String functionCode;    // Mã chức năng (e.g. "HR_EMPLOYEE")

    @Column(nullable = false)
    private Boolean allowed = true; // Cho phép quyền

    public RolePermission(String roleName, String functionCode, Boolean allowed) {
        this.roleName = roleName;
        this.functionCode = functionCode;
        this.allowed = allowed;
    }
}
