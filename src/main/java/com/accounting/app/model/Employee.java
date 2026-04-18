package com.accounting.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "employees") // Bảng Nhân viên
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Employee extends BaseEntity {
    @Id
    @NotBlank(message = "Mã nhân viên không được để trống")
    private String id; // Mã nhân viên 

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName; // Họ và tên

    @NotNull(message = "Lương hợp đồng không được để trống")
    @Min(value = 0, message = "Lương không được nhỏ hơn 0")
    private Double contractSalary; // Lương hợp đồng

    @Min(value = 0, message = "Số người phụ thuộc không được nhỏ hơn 0")
    private Integer dependentCount; // Số người phụ thuộc

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    private LocalDate dob; // Ngày sinh 

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)\\d{8,11}$", 
             message = "Số điện thoại không đúng định dạng (8-11 số)")
    private String phone; // Số điện thoại

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email; // Thư điện tử (Email)

    @NotBlank(message = "Quê quán không được để trống")
    private String hometown; // Quê quán
    private String department; // Phòng ban
    private String contractFilePath; // Đường dẫn file hợp đồng 

    private Double positionCoefficient = 0.0; // Hệ số chức vụ: 0.4 - 1.0 (nhân lương tối thiểu)
    private Double seniorityAllowance = 0.0;   // Phụ cấp thâm niên (cố định theo năm)

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Loại hình nhân sự không được để trống")
    private EmployeeType employeeType; // Loại hình nhân viên

    @Enumerated(EnumType.STRING)
    private EmployeeStatus status = EmployeeStatus.WORKING;

    @Transient
    private boolean onLeave = false;

    public Employee(String id, String fullName, Double contractSalary, Integer dependentCount, EmployeeType type) {
        this.id = id;
        this.fullName = fullName;
        this.contractSalary = contractSalary;
        this.dependentCount = dependentCount;
        this.employeeType = type;
        this.status = EmployeeStatus.WORKING;
    }

    // Helpers for compatibility with existing code
    public boolean getActive() {
        return status != EmployeeStatus.LEFT;
    }

    public void setActive(boolean active) {
        this.status = active ? EmployeeStatus.WORKING : EmployeeStatus.LEFT;
    }
}
