package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.math.BigDecimal;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "cau_hinh_bao_hiem") // Bảng Cấu hình bảo hiểm
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceConfig extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NLĐ đóng (%)
    @Column(name = "bhxh_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhxhEmployee = new BigDecimal("8.0"); // Bảo hiểm xã hội (Nhân viên đóng)

    @Column(name = "bhyt_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhytEmployee = new BigDecimal("1.5"); // Bảo hiểm y tế (Nhân viên đóng)

    @Column(name = "bhtn_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhtnEmployee = new BigDecimal("1.0"); // Bảo hiểm thất nghiệp (Nhân viên đóng)

    // Doanh nghiệp đóng (%)
    @Column(name = "bhxh_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhxhEmployer = new BigDecimal("17.5"); // Bảo hiểm xã hội (Doanh nghiệp đóng)

    @Column(name = "bhyt_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhytEmployer = new BigDecimal("3.0"); // Bảo hiểm y tế (Doanh nghiệp đóng)

    @Column(name = "bhtn_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhtnEmployer = new BigDecimal("1.0"); // Bảo hiểm thất nghiệp (Doanh nghiệp đóng)

    @Column(name = "kpcd_cong_ty", precision = 19, scale = 2)
    private BigDecimal kpcdEmployer = new BigDecimal("2.0"); // Kinh phí công đoàn (Doanh nghiệp đóng)

    @Column(name = "ngay_hieu_luc")
    private LocalDate effectiveDate = LocalDate.now(); // Ngày hiệu lực

    @Column(name = "trang_thai", length = 30)
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
