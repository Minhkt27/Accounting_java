package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "deduction_settings") // Bảng Cài đặt giảm trừ
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class DeductionSetting extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Mã định danh

    private Double personalDeduction; // Giảm trừ gia cảnh bản thân
    private Double dependentDeduction; // Giảm trừ người phụ thuộc
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
