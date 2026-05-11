package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tham_so_luong") // Bảng Tham số lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SalaryParameter extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ngay_cong_chuan")
    private Double standardWorkDays; // Ngày công chuẩn

    @Column(name = "che_do_ngay_cong_chuan")
    private String standardWorkDayMode = "FIXED"; // Chế độ ngày công chuẩn (FIXED or MONTHLY)

    @Column(name = "luong_toi_thieu_vung")
    private Double minimumWage; // Mức lương tối thiểu vùng

    @Column(name = "luong_co_so")
    private Double baseSalary; // Mức lương cơ sở

    @Column(name = "muc_tran_bao_hiem")
    private Double insuranceCeiling; // Mức trần đóng bảo hiểm

    @Column(name = "phu_cap_an_trua")
    private Double mealAllowance; // Phụ cấp ăn trưa

    @Column(name = "trang_thai")
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
