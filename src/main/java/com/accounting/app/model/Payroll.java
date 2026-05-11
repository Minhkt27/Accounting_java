package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    @Column(name = "luong_hop_dong")
    private Double contractSalary;   // Lương hợp đồng tại thời điểm tính

    @Column(name = "so_ngay_di_lam")
    private Double realWorkDays;     // Số ngày thực tế đi làm

    @Column(name = "so_ngay_nghi_co_luong")
    private Double paidLeaveDays;    // Số ngày nghỉ hưởng lương

    @Column(name = "ngay_cong_chuan")
    private Double standardWorkDays;     // Ngày công chuẩn (22, 24, 26...)

    @Column(name = "luong_chinh")
    private Double baseSalaryPay;    // Lương chính = (Lương HĐ / Standard) * (realWorkDays + paidLeaveDays)

    // Làm thêm giờ (giờ)
    @Column(name = "gio_tang_ca_ngay_thuong")
    private Double otNormalHours = 0.0;

    @Column(name = "gio_tang_ca_cuoi_tuan")
    private Double otWeekendHours = 0.0;

    @Column(name = "gio_tang_ca_ngay_le")
    private Double otHolidayHours = 0.0;

    // Làm thêm giờ
    @Column(name = "tien_tang_ca_ngay_thuong")
    private Double otNormalPay = 0.0;

    @Column(name = "tien_tang_ca_cuoi_tuan")
    private Double otWeekendPay = 0.0;

    @Column(name = "tien_tang_ca_ngay_le")
    private Double otHolidayPay = 0.0;

    @Column(name = "tong_tien_tang_ca")
    private Double otPay = 0.0;         // Tổng tiền OT (Bao gồm cả phần chịu thuế và miễn thuế)

    @Column(name = "tien_tang_ca_mien_thue")
    private Double otPremiumPay = 0.0;  // Phần OT miễn thuế (Phần chênh lệch hệ số > 1.0)

    // Phụ cấp & Thưởng
    @Column(name = "phu_cap_an_trua")
    private Double mealAllowance = 0.0; // Phụ cấp ăn trưa

    @Column(name = "phu_cap_chuc_vu")
    private Double positionAllowance = 0.0; // Phụ cấp chức vụ

    @Column(name = "phu_cap_tham_nien")
    private Double seniorityAllowance = 0.0; // Phụ cấp thâm niên

    @Column(name = "phu_cap_khac")
    private Double otherAllowances = 0.0; // Phụ cấp khác

    @Column(name = "tien_thuong")
    private Double bonus = 0.0; // Tiền thưởng

    @Column(name = "tien_phat")
    private Double penalty = 0.0; // Tiền phạt

    // Tổng thu nhập (Gross)
    @Column(name = "tong_thu_nhap_truoc_thue")
    private Double grossIncome;      // Lương chính + OT + phụ cấp + thưởng

    // Các khoản trích (BH - Phần NLĐ đóng 10.5%)
    @Column(name = "bhxh_nhan_vien")
    private Double bhxhNhanVien = 0.0; // BHXH (Nhân viên)

    @Column(name = "bhyt_nhan_vien")
    private Double bhytNhanVien = 0.0; // BHYT (Nhân viên)

    @Column(name = "bhtn_nhan_vien")
    private Double bhtnNhanVien = 0.0; // BHTN (Nhân viên)

    @Column(name = "tong_bao_hiem_nhan_vien")
    private Double totalInsurance = 0.0; // Tổng bảo hiểm (Nhân viên)

    // Các khoản trích (BH - Phần DN đóng 23.5%)
    @Column(name = "bhxh_cong_ty")
    private Double bhxhCongTy = 0.0;   // BHXH (Công ty - 17.5%)

    @Column(name = "bhyt_cong_ty")
    private Double bhytCongTy = 0.0;   // BHYT (Công ty - 3%)

    @Column(name = "bhtn_cong_ty")
    private Double bhtnCongTy = 0.0;   // BHTN (Công ty - 1%)

    @Column(name = "kpcd_cong_ty")
    private Double kpcdCongTy = 0.0;   // Kinh phí công đoàn (Công ty - 2%)

    @Column(name = "tong_bao_hiem_cong_ty")
    private Double totalEmployerInsurance = 0.0; // Tổng bảo hiểm (Công ty)

    // Thuế TNCN
    @Column(name = "thu_nhap_chiu_thue_co_ban")
    private Double taxableIncomeBase = 0.0;    // Thu nhập chịu thuế (Gross - Miễn thuế)

    @Column(name = "giam_tru_ban_than")
    private Double personalDeduction = 0.0;    // Giảm trừ bản thân (VD: 11tr)

    @Column(name = "giam_tru_gia_canh")
    private Double dependentDeduction = 0.0;   // Tổng giảm trừ gia cảnh (VD: count * 4.4tr)

    @Column(name = "so_nguoi_phu_thuoc")
    private Integer dependentCount = 0;        // Số người phụ thuộc tại thời điểm tính

    @Column(name = "thu_nhap_tinh_thue")
    private Double taxableIncome = 0.0;        // Thu nhập tính thuế (Base - Ins - Deductions)

    @Column(name = "so_tien_thue")
    private Double taxAmount = 0.0;

    @Column(name = "giam_tru_tu_thien")
    private Double charityDeduction = 0.0;     // Các khoản đóng góp từ thiện, nhân đạo


    // Lương thực lĩnh (Net)
    @Column(name = "luong_thuc_linh")
    private Double netPay;           // Lương thực lĩnh (Gross - Insurance_EE - Tax)

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
