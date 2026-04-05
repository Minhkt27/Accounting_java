package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "insurance_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NLĐ đóng (%)
    private Double bhxhEmployee = 8.0;
    private Double bhytEmployee = 1.5;
    private Double bhtnEmployee = 1.0;

    // Doanh nghiệp đóng (%)
    private Double bhxhEmployer = 17.5;
    private Double bhytEmployer = 3.0;
    private Double bhtnEmployer = 1.0;
    private Double kpcdEmployer = 2.0;

    private LocalDate effectiveDate = LocalDate.now();
    private String status = "APPROVED"; // APPROVED, PENDING
}
