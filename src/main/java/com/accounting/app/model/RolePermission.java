package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quyen_han_vai_tro", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "ten_vai_tro", "ma_chuc_nang" })
}) // Bảng Quyền hạn vai trò
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class RolePermission extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ten_vai_tro", nullable = false, length = 50)
    private String roleName; // Tên vai trò (e.g. "ROLE_NHAN_SU")

    @Column(name = "ma_chuc_nang", nullable = false, length = 50)
    private String functionCode; // Mã chức năng (e.g. "HR_EMPLOYEE")

    @Column(name = "duoc_phep", nullable = false)
    private Boolean allowed = true; // Cho phép quyền

    public RolePermission(String roleName, String functionCode, Boolean allowed) {
        this.roleName = roleName;
        this.functionCode = functionCode;
        this.allowed = allowed;
    }
}
