package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "deduction_settings")
@NoArgsConstructor
@AllArgsConstructor
@Data
public class DeductionSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double personalDeduction;
    private Double dependentDeduction;
    private String status = "APPROVED"; // APPROVED, PENDING
}
