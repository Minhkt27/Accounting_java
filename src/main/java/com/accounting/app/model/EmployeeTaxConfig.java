package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "employee_tax_configs") // Bảng Cấu hình thuế nhân viên
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaxConfig extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private EmployeeType employeeType; // Loại hình nhân viên

    @Enumerated(EnumType.STRING)
    private TaxMethod taxMethod = TaxMethod.PROGRESSIVE; // Phương pháp tính thuế

    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
