package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "role_permissions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"role_name", "function_code"})
})
@Data
@NoArgsConstructor
public class RolePermission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_name", nullable = false)
    private String roleName;        // e.g. "ROLE_NHAN_SU"

    @Column(name = "function_code", nullable = false)
    private String functionCode;    // e.g. "HR_EMPLOYEE"

    @Column(nullable = false)
    private Boolean allowed = true;

    public RolePermission(String roleName, String functionCode, Boolean allowed) {
        this.roleName = roleName;
        this.functionCode = functionCode;
        this.allowed = allowed;
    }
}
