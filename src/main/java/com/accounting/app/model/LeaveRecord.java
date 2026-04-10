package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "leave_records") // Bảng Hồ sơ nghỉ phép
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class LeaveRecord extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // Nhân viên

    @Enumerated(EnumType.STRING)
    private LeaveType leaveType; // Loại nghỉ

    private LocalDate startDate; // Ngày bắt đầu
    private LocalDate endDate; // Ngày kết thúc
}
