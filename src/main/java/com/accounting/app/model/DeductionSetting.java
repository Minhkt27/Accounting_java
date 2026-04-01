package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "deduction_settings")
@Data
public class DeductionSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double personalDeduction;
    private Double dependentDeduction;
}
