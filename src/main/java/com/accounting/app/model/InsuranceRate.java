package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "insurance_rates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type;
    private Double employeeRate;
    private Double employerRate;
    
    private LocalDate effectiveDate;
}
