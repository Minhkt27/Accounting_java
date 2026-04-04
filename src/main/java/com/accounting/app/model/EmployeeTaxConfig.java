package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "employee_tax_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaxConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private EmployeeType employeeType;

    @Enumerated(EnumType.STRING)
    private TaxMethod taxMethod = TaxMethod.PROGRESSIVE;

    private String status = "APPROVED"; // APPROVED, PENDING
}
