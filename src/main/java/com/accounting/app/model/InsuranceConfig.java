package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "insurance_configs") // Bảng Cấu hình bảo hiểm
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceConfig extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NLĐ đóng (%)
    private Double bhxhEmployee = 8.0; // Bảo hiểm xã hội (Nhân viên đóng)
    private Double bhytEmployee = 1.5; // Bảo hiểm y tế (Nhân viên đóng)
    private Double bhtnEmployee = 1.0; // Bảo hiểm thất nghiệp (Nhân viên đóng)

    // Doanh nghiệp đóng (%)
    private Double bhxhEmployer = 17.5; // Bảo hiểm xã hội (Doanh nghiệp đóng)
    private Double bhytEmployer = 3.0; // Bảo hiểm y tế (Doanh nghiệp đóng)
    private Double bhtnEmployer = 1.0; // Bảo hiểm thất nghiệp (Doanh nghiệp đóng)
    private Double kpcdEmployer = 2.0; // Kinh phí công đoàn (Doanh nghiệp đóng)

    private LocalDate effectiveDate = LocalDate.now(); // Ngày hiệu lực
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
