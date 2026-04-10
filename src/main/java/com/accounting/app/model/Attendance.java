package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "attendance", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"employee_id", "month", "year"})
})
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Attendance extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private Integer month;
    private Integer year;

    private Double realWorkDays; // Số ngày thực tế đi làm (Physical presence)
    private Double paidLeaveDays; // Số ngày nghỉ hưởng lương (Paid leave)
    
    private Double otNormalHours = 0.0;
    private Double otWeekendHours = 0.0;
    private Double otHolidayHours = 0.0;

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
