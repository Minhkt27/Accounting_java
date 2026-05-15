package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "bang_luong", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ma_nhan_vien", "thang", "nam"})
}) // Bảng Lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Payroll extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ma_nhan_vien")
    private Employee employee; // Nhân viên

    @Column(name = "thang")
    private Integer month; // Tháng

    @Column(name = "nam")
    private Integer year; // Năm

    // Lương thời gian
    @Column(name = "luong_hop_dong", precision = 19, scale = 2)
    private BigDecimal contractSalary;   // Lương hợp đồng tại thời điểm tính

    @Column(name = "so_ngay_di_lam", precision = 19, scale = 2)
    private BigDecimal realWorkDays;     // Số ngày thực tế đi làm

    @Column(name = "so_ngay_nghi_co_luong", precision = 19, scale = 2)
    private BigDecimal paidLeaveDays;    // Số ngày nghỉ hưởng lương

    @Column(name = "ngay_cong_chuan", precision = 19, scale = 2)
    private BigDecimal standardWorkDays;     // Ngày công chuẩn (22, 24, 26...)

    @Column(name = "luong_chinh", precision = 19, scale = 2)
    private BigDecimal baseSalaryPay;    // Lương chính = (Lương HĐ / Standard) * (realWorkDays + paidLeaveDays)

    // Làm thêm giờ (giờ)
    @Column(name = "gio_tang_ca_ngay_thuong", precision = 19, scale = 2)
    private BigDecimal otNormalHours = BigDecimal.ZERO;

    @Column(name = "gio_tang_ca_cuoi_tuan", precision = 19, scale = 2)
    private BigDecimal otWeekendHours = BigDecimal.ZERO;

    @Column(name = "gio_tang_ca_ngay_le", precision = 19, scale = 2)
    private BigDecimal otHolidayHours = BigDecimal.ZERO;

    // Làm thêm giờ
    @Column(name = "tien_tang_ca_ngay_thuong", precision = 19, scale = 2)
    private BigDecimal otNormalPay = BigDecimal.ZERO;

    @Column(name = "tien_tang_ca_cuoi_tuan", precision = 19, scale = 2)
    private BigDecimal otWeekendPay = BigDecimal.ZERO;

    @Column(name = "tien_tang_ca_ngay_le", precision = 19, scale = 2)
    private BigDecimal otHolidayPay = BigDecimal.ZERO;

    @Column(name = "tong_tien_tang_ca", precision = 19, scale = 2)
    private BigDecimal otPay = BigDecimal.ZERO;         // Tổng tiền OT (Bao gồm cả phần chịu thuế và miễn thuế)

    @Column(name = "tien_tang_ca_mien_thue", precision = 19, scale = 2)
    private BigDecimal otPremiumPay = BigDecimal.ZERO;  // Phần OT miễn thuế (Phần chênh lệch hệ số > 1.0)

    // Phụ cấp & Thưởng
    @Column(name = "phu_cap_an_trua", precision = 19, scale = 2)
    private BigDecimal mealAllowance = BigDecimal.ZERO; // Phụ cấp ăn trưa

    @Column(name = "phu_cap_chuc_vu", precision = 19, scale = 2)
    private BigDecimal positionAllowance = BigDecimal.ZERO; // Phụ cấp chức vụ

    @Column(name = "phu_cap_tham_nien", precision = 19, scale = 2)
    private BigDecimal seniorityAllowance = BigDecimal.ZERO; // Phụ cấp thâm niên

    @Column(name = "phu_cap_khac", precision = 19, scale = 2)
    private BigDecimal otherAllowances = BigDecimal.ZERO; // Phụ cấp khác

    @Column(name = "tien_thuong", precision = 19, scale = 2)
    private BigDecimal bonus = BigDecimal.ZERO; // Tiền thưởng

    @Column(name = "tien_phat", precision = 19, scale = 2)
    private BigDecimal penalty = BigDecimal.ZERO; // Tiền phạt

    // Tổng thu nhập (Gross)
    @Column(name = "tong_thu_nhap_truoc_thue", precision = 19, scale = 2)
    private BigDecimal grossIncome;      // Lương chính + OT + phụ cấp + thưởng

    // Các khoản trích (BH - Phần NLĐ đóng 10.5%)
    @Column(name = "bhxh_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhxhNhanVien = BigDecimal.ZERO; // BHXH (Nhân viên)

    @Column(name = "bhyt_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhytNhanVien = BigDecimal.ZERO; // BHYT (Nhân viên)

    @Column(name = "bhtn_nhan_vien", precision = 19, scale = 2)
    private BigDecimal bhtnNhanVien = BigDecimal.ZERO; // BHTN (Nhân viên)

    @Column(name = "tong_bao_hiem_nhan_vien", precision = 19, scale = 2)
    private BigDecimal totalInsurance = BigDecimal.ZERO; // Tổng bảo hiểm (Nhân viên)

    // Các khoản trích (BH - Phần DN đóng 23.5%)
    @Column(name = "bhxh_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhxhCongTy = BigDecimal.ZERO;   // BHXH (Công ty - 17.5%)

    @Column(name = "bhyt_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhytCongTy = BigDecimal.ZERO;   // BHYT (Công ty - 3%)

    @Column(name = "bhtn_cong_ty", precision = 19, scale = 2)
    private BigDecimal bhtnCongTy = BigDecimal.ZERO;   // BHTN (Công ty - 1%)

    @Column(name = "kpcd_cong_ty", precision = 19, scale = 2)
    private BigDecimal kpcdCongTy = BigDecimal.ZERO;   // Kinh phí công đoàn (Công ty - 2%)

    @Column(name = "tong_bao_hiem_cong_ty", precision = 19, scale = 2)
    private BigDecimal totalEmployerInsurance = BigDecimal.ZERO; // Tổng bảo hiểm (Công ty)

    // Thuế TNCN
    @Column(name = "thu_nhap_chiu_thue_co_ban", precision = 19, scale = 2)
    private BigDecimal taxableIncomeBase = BigDecimal.ZERO;    // Thu nhập chịu thuế (Gross - Miễn thuế)

    @Column(name = "giam_tru_ban_than", precision = 19, scale = 2)
    private BigDecimal personalDeduction = BigDecimal.ZERO;    // Giảm trừ bản thân (VD: 11tr)

    @Column(name = "giam_tru_gia_canh", precision = 19, scale = 2)
    private BigDecimal dependentDeduction = BigDecimal.ZERO;   // Tổng giảm trừ gia cảnh (VD: count * 4.4tr)

    @Column(name = "so_nguoi_phu_thuoc")
    private Integer dependentCount = 0;        // Số người phụ thuộc tại thời điểm tính

    @Column(name = "thu_nhap_tinh_thue", precision = 19, scale = 2)
    private BigDecimal taxableIncome = BigDecimal.ZERO;        // Thu nhập tính thuế (Base - Ins - Deductions)

    @Column(name = "so_tien_thue", precision = 19, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "giam_tru_tu_thien", precision = 19, scale = 2)
    private BigDecimal charityDeduction = BigDecimal.ZERO;     // Các khoản đóng góp từ thiện, nhân đạo


    // Lương thực lĩnh (Net)
    @Column(name = "luong_thuc_linh", precision = 19, scale = 2)
    private BigDecimal netPay;           // Lương thực lĩnh (Gross - Insurance_EE - Tax)

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai")
    private PayrollStatus status; // Trạng thái bảng lương

    @Column(name = "nguoi_duyet")
    private String approvedBy;          // Người phê duyệt

    @Column(name = "ngay_duyet")
    private LocalDateTime approvedAt;   // Thời điểm phê duyệt

    @Column(name = "ly_do_tu_choi")
    private String rejectionReason;     // Lý do từ chối (nếu REJECTED)
}
