package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Entity
@Table(name = "cai_dat_giam_tru") // Bảng Cài đặt giảm trừ
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class DeductionSetting extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Mã định danh

    @Column(name = "giam_tru_ban_than", precision = 19, scale = 2)
    private BigDecimal personalDeduction; // Giảm trừ gia cảnh bản thân

    @Column(name = "giam_tru_phu_thuoc", precision = 19, scale = 2)
    private BigDecimal dependentDeduction; // Giảm trừ người phụ thuộc

    @Column(name = "trang_thai", length = 30)
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
