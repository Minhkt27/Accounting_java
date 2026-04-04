package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "payrolls", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "month", "year"})
})
@Data
@NoArgsConstructor
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Integer month;
    private Integer year;

    // Lương thời gian
    private Double contractSalary;   // Lương HĐ tại thời điểm tính
    private Double realWorkDays;     // Số ngày thực tế đi làm
    private Double paidLeaveDays;    // Số ngày nghỉ hưởng lương
    private Double baseSalaryPay;    // Lương chính = (Lương HĐ / Standard) * (realWorkDays + paidLeaveDays)

    // Làm thêm giờ
    private Double otNormalPay = 0.0;
    private Double otWeekendPay = 0.0;
    private Double otHolidayPay = 0.0;
    private Double otPay = 0.0;         // Tổng tiền OT (Bao gồm cả phần chịu thuế và miễn thuế)
    private Double otPremiumPay = 0.0;  // Phần OT miễn thuế (Phần chênh lệch hệ số > 1.0)

    // Phụ cấp & Thưởng
    private Double mealAllowance = 0.0;
    private Double positionAllowance = 0.0;
    private Double seniorityAllowance = 0.0;
    private Double otherAllowances = 0.0;
    private Double bonus = 0.0;
    private Double penalty = 0.0;

    // Tổng thu nhập (Gross)
    private Double grossIncome;      // Lương chính + OT + phụ cấp + thưởng

    // Các khoản trích (BH - Phần NLĐ đóng 10.5%)
    private Double bhxhNhanVien = 0.0;
    private Double bhytNhanVien = 0.0;
    private Double bhtnNhanVien = 0.0;
    private Double totalInsurance = 0.0;

    // Các khoản trích (BH - Phần DN đóng 23.5%)
    private Double bhxhCongTy = 0.0;   // 17.5%
    private Double bhytCongTy = 0.0;   // 3%
    private Double bhtnCongTy = 0.0;   // 1%
    private Double kpcdCongTy = 0.0;   // 2% (Kinh phí công đoàn)
    private Double totalEmployerInsurance = 0.0;

    // Thuế TNCN
    private Double taxableIncome = 0.0;
    private Double taxAmount = 0.0;
    private Double charityDeduction = 0.0; // Các khoản đóng góp từ thiện, nhân đạo


    // Lương thực lĩnh (Net)
    private Double netPay;           // Gross - Insurance_EE - Tax

    @Enumerated(EnumType.STRING)
    private PayrollStatus status;

    private String approvedBy;          // Người phê duyệt
    private LocalDateTime approvedAt;   // Thời điểm phê duyệt
    private String rejectionReason;     // Lý do từ chối (nếu REJECTED)

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
