package com.accounting.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "employees")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Employee extends BaseEntity {
    @Id
    @NotBlank(message = "Mã nhân viên không được để trống")
    private String id; 

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @Min(value = 0, message = "Lương không được nhỏ hơn 0")
    private Double contractSalary;

    @Min(value = 0, message = "Số người phụ thuộc không được nhỏ hơn 0")
    private Integer dependentCount;

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate dob; 

    @Pattern(regexp = "^(0|\\+84)\\d{8,11}$", 
             message = "Số điện thoại không đúng định dạng (8-11 số)")
    private String phone;

    private String email;
    private String hometown;
    private String department;
    private String contractFilePath; 

    private Double positionCoefficient = 0.0; // Hệ số chức vụ: 0.4 - 1.0 (nhân lương tối thiểu)
    private Double seniorityAllowance = 0.0;   // Phụ cấp thâm niên (cố định theo năm)

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Loại hình nhân sự không được để trống")
    private EmployeeType employeeType;

    private Boolean active = true;

    public Employee(String id, String fullName, Double contractSalary, Integer dependentCount, EmployeeType type) {
        this.id = id;
        this.fullName = fullName;
        this.contractSalary = contractSalary;
        this.dependentCount = dependentCount;
        this.employeeType = type;
        this.active = true;
    }
}
