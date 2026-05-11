package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

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

    @Column(name = "giam_tru_ban_than")
    private Double personalDeduction; // Giảm trừ gia cảnh bản thân

    @Column(name = "giam_tru_phu_thuoc")
    private Double dependentDeduction; // Giảm trừ người phụ thuộc

    @Column(name = "trang_thai")
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
