package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "salary_parameters")
@Data
public class SalaryParameter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double standardWorkDays;
    private String standardWorkDayMode = "FIXED"; // FIXED or MONTHLY
    private Double minimumWage;
    private Double baseSalary;
    private Double insuranceCeiling;
    private Double mealAllowance;
    private String status = "APPROVED"; // APPROVED, PENDING
}
