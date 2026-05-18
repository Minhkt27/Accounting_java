package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "bac_thue") // Bảng Bậc thuế
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class TaxTier extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "can_duoi_thang", precision = 19, scale = 2)
    private BigDecimal lowerBound; // Cận dưới (tháng)

    @Column(name = "can_tren_thang", precision = 19, scale = 2)
    private BigDecimal upperBound; // Cận trên (tháng)

    @Column(name = "can_duoi_nam", precision = 19, scale = 2)
    private BigDecimal lowerBoundYearly; // Cận dưới (năm)

    @Column(name = "can_tren_nam", precision = 19, scale = 2)
    private BigDecimal upperBoundYearly; // Cận trên (năm)

    @Column(name = "thue_suat", precision = 19, scale = 2)
    private BigDecimal taxRate; // Thuế suất

    @Column(name = "bac_thue")
    private Integer tierLevel; // Bậc thuế

    @Column(name = "trang_thai", length = 30)
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
