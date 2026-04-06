package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "tax_tiers")
@Data
public class TaxTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double lowerBound;
    private Double upperBound;
    private Double lowerBoundYearly;
    private Double upperBoundYearly;
    private Double taxRate;
    private Integer tierLevel;
    private String status = "APPROVED"; // APPROVED, PENDING
}
