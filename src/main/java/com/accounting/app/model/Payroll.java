package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "payrolls", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "month", "year"})
}) // Bảng Lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Payroll extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // Nhân viên

    private Integer month; // Tháng
    private Integer year; // Năm

    // Lương thời gian
    private Double contractSalary;   // Lương hợp đồng tại thời điểm tính
    private Double realWorkDays;     // Số ngày thực tế đi làm
    private Double paidLeaveDays;    // Số ngày nghỉ hưởng lương
    private Double standardWorkDays;     // Ngày công chuẩn (22, 24, 26...)
    private Double baseSalaryPay;    // Lương chính = (Lương HĐ / Standard) * (realWorkDays + paidLeaveDays)

    // Làm thêm giờ (giờ)
    private Double otNormalHours = 0.0;
    private Double otWeekendHours = 0.0;
    private Double otHolidayHours = 0.0;

    // Làm thêm giờ
    private Double otNormalPay = 0.0;
    private Double otWeekendPay = 0.0;
    private Double otHolidayPay = 0.0;
    private Double otPay = 0.0;         // Tổng tiền OT (Bao gồm cả phần chịu thuế và miễn thuế)
    private Double otPremiumPay = 0.0;  // Phần OT miễn thuế (Phần chênh lệch hệ số > 1.0)

    // Phụ cấp & Thưởng
    private Double mealAllowance = 0.0; // Phụ cấp ăn trưa
    private Double positionAllowance = 0.0; // Phụ cấp chức vụ
    private Double seniorityAllowance = 0.0; // Phụ cấp thâm niên
    private Double otherAllowances = 0.0; // Phụ cấp khác
    private Double bonus = 0.0; // Tiền thưởng
    private Double penalty = 0.0; // Tiền phạt

    // Tổng thu nhập (Gross)
    private Double grossIncome;      // Lương chính + OT + phụ cấp + thưởng

    // Các khoản trích (BH - Phần NLĐ đóng 10.5%)
    private Double bhxhNhanVien = 0.0; // BHXH (Nhân viên)
    private Double bhytNhanVien = 0.0; // BHYT (Nhân viên)
    private Double bhtnNhanVien = 0.0; // BHTN (Nhân viên)
    private Double totalInsurance = 0.0; // Tổng bảo hiểm (Nhân viên)

    // Các khoản trích (BH - Phần DN đóng 23.5%)
    private Double bhxhCongTy = 0.0;   // BHXH (Công ty - 17.5%)
    private Double bhytCongTy = 0.0;   // BHYT (Công ty - 3%)
    private Double bhtnCongTy = 0.0;   // BHTN (Công ty - 1%)
    private Double kpcdCongTy = 0.0;   // Kinh phí công đoàn (Công ty - 2%)
    private Double totalEmployerInsurance = 0.0; // Tổng bảo hiểm (Công ty)

    // Thuế TNCN
    private Double taxableIncomeBase = 0.0;    // Thu nhập chịu thuế (Gross - Miễn thuế)
    private Double personalDeduction = 0.0;    // Giảm trừ bản thân (VD: 11tr)
    private Double dependentDeduction = 0.0;   // Tổng giảm trừ gia cảnh (VD: count * 4.4tr)
    private Integer dependentCount = 0;        // Số người phụ thuộc tại thời điểm tính
    private Double taxableIncome = 0.0;        // Thu nhập tính thuế (Base - Ins - Deductions)
    private Double taxAmount = 0.0;
    private Double charityDeduction = 0.0;     // Các khoản đóng góp từ thiện, nhân đạo


    // Lương thực lĩnh (Net)
    private Double netPay;           // Lương thực lĩnh (Gross - Insurance_EE - Tax)

    @Enumerated(EnumType.STRING)
    private PayrollStatus status; // Trạng thái bảng lương

    private String approvedBy;          // Người phê duyệt
    private LocalDateTime approvedAt;   // Thời điểm phê duyệt
    private String rejectionReason;     // Lý do từ chối (nếu REJECTED)
}
