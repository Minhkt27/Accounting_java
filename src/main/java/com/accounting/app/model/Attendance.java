package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "cham_cong", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ma_nhan_vien", "thang", "nam"})
}) // Bảng Chấm công
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Attendance extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Mã định danh

    @ManyToOne
    @JoinColumn(name = "ma_nhan_vien")
    private Employee employee; // Nhân viên

    @Column(name = "thang")
    private Integer month; // Tháng

    @Column(name = "nam")
    private Integer year; // Năm

    @Column(name = "so_ngay_di_lam", precision = 19, scale = 2)
    private BigDecimal realWorkDays; // Số ngày thực tế đi làm (Physical presence)

    @Column(name = "so_ngay_nghi_co_luong", precision = 19, scale = 2)
    private BigDecimal paidLeaveDays; // Số ngày nghỉ hưởng lương (Paid leave)
    
    @Column(name = "gio_tang_ca_ngay_thuong", precision = 19, scale = 2)
    private BigDecimal otNormalHours = BigDecimal.ZERO; // Giờ làm thêm ngày thường

    @Column(name = "gio_tang_ca_cuoi_tuan", precision = 19, scale = 2)
    private BigDecimal otWeekendHours = BigDecimal.ZERO; // Giờ làm thêm ngày nghỉ

    @Column(name = "gio_tang_ca_ngay_le", precision = 19, scale = 2)
    private BigDecimal otHolidayHours = BigDecimal.ZERO; // Giờ làm thêm ngày lễ

    public Attendance(Employee employee, Integer month, Integer year, BigDecimal realWorkDays, BigDecimal paidLeaveDays, BigDecimal otNormalHours, BigDecimal otWeekendHours, BigDecimal otHolidayHours) {
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
