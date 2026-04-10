package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "month", "year"})
}) // Bảng Chấm công
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Attendance extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Mã định danh

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // Nhân viên

    private Integer month; // Tháng
    private Integer year; // Năm

    private Double realWorkDays; // Số ngày thực tế đi làm (Physical presence)
    private Double paidLeaveDays; // Số ngày nghỉ hưởng lương (Paid leave)
    
    private Double otNormalHours = 0.0; // Giờ làm thêm ngày thường
    private Double otWeekendHours = 0.0; // Giờ làm thêm ngày nghỉ
    private Double otHolidayHours = 0.0; // Giờ làm thêm ngày lễ

    public Attendance(Employee employee, Integer month, Integer year, Double realWorkDays, Double paidLeaveDays, Double otNormalHours, Double otWeekendHours, Double otHolidayHours) {
        this.employee = employee;
        this.month = month;
        this.year = year;
        this.realWorkDays = realWorkDays;
        this.paidLeaveDays = paidLeaveDays;
        this.otNormalHours = otNormalHours;
        this.otWeekendHours = otWeekendHours;
        this.otHolidayHours = otHolidayHours;
    }
}
