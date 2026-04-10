package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "salary_parameters") // Bảng Tham số lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SalaryParameter extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double standardWorkDays; // Ngày công chuẩn
    private String standardWorkDayMode = "FIXED"; // Chế độ ngày công chuẩn (FIXED or MONTHLY)
    private Double minimumWage; // Mức lương tối thiểu vùng
    private Double baseSalary; // Mức lương cơ sở
    private Double insuranceCeiling; // Mức trần đóng bảo hiểm
    private Double mealAllowance; // Phụ cấp ăn trưa
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
