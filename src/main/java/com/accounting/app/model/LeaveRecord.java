package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "ho_so_nghi_phep") // Bảng Hồ sơ nghỉ phép
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class LeaveRecord extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ma_nhan_vien")
    private Employee employee; // Nhân viên

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_nghi_phep", length = 50)
    private LeaveType leaveType; // Loại nghỉ

    @Column(name = "ngay_bat_dau")
    private LocalDate startDate; // Ngày bắt đầu

    @Column(name = "ngay_ket_thuc")
    private LocalDate endDate; // Ngày kết thúc
}
