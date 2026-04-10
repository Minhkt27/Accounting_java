package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tax_tiers") // Bảng Bậc thuế
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class TaxTier extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double lowerBound; // Cận dưới (tháng)
    private Double upperBound; // Cận trên (tháng)
    private Double lowerBoundYearly; // Cận dưới (năm)
    private Double upperBoundYearly; // Cận trên (năm)
    private Double taxRate; // Thuế suất
    private Integer tierLevel; // Bậc thuế
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
