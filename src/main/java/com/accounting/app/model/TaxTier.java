package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bac_thue") // Bảng Bậc thuế
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class TaxTier extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "can_duoi_thang")
    private Double lowerBound; // Cận dưới (tháng)

    @Column(name = "can_tren_thang")
    private Double upperBound; // Cận trên (tháng)

    @Column(name = "can_duoi_nam")
    private Double lowerBoundYearly; // Cận dưới (năm)

    @Column(name = "can_tren_nam")
    private Double upperBoundYearly; // Cận trên (năm)

    @Column(name = "thue_suat")
    private Double taxRate; // Thuế suất

    @Column(name = "bac_thue")
    private Integer tierLevel; // Bậc thuế

    @Column(name = "trang_thai")
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
