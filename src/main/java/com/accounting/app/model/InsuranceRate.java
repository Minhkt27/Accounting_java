package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "insurance_rates") // Bảng Tỷ lệ bảo hiểm
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class InsuranceRate extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // Loại bảo hiểm
    private Double employeeRate; // Tỷ lệ nhân viên đóng
    private Double employerRate; // Tỷ lệ doanh nghiệp đóng
    
    private LocalDate effectiveDate; // Ngày hiệu lực
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
