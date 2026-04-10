package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "insurance_rates")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceRate extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private Double employeeRate;
    private Double employerRate;
    
    private LocalDate effectiveDate;
    private String status = "APPROVED"; // APPROVED, PENDING
}
