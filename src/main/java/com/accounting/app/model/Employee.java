package com.accounting.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.math.BigDecimal;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "nhan_vien") // Bảng Nhân viên
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Employee extends BaseEntity {
    @Id
    @NotBlank(message = "Mã nhân viên không được để trống")
    @Column(name = "ma_nhan_vien", length = 20)
    private String id; // Mã nhân viên

    @NotBlank(message = "Họ tên không được để trống")
    @Column(name = "ho_ten", length = 100)
    private String fullName; // Họ và tên

    @NotNull(message = "Lương hợp đồng không được để trống")
    @Min(value = 0, message = "Lương không được nhỏ hơn 0")
    @Column(name = "luong_hop_dong", precision = 19, scale = 2)
    private BigDecimal contractSalary; // Lương hợp đồng

    @Min(value = 0, message = "Số người phụ thuộc không được nhỏ hơn 0")
    @Column(name = "so_nguoi_phu_thuoc")
    private Integer dependentCount; // Số người phụ thuộc

    @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
    @Column(name = "ngay_sinh")
    private LocalDate dob; // Ngày sinh

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)\\d{8,11}$", message = "Số điện thoại không đúng định dạng (8-11 số)")
    @Column(name = "so_dien_thoai", length = 15)
    private String phone; // Số điện thoại

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Column(name = "email", length = 100)
    private String email; // Thư điện tử (Email)

    @NotBlank(message = "Quê quán không được để trống")
    @Column(name = "que_quan", length = 100)
    private String hometown; // Quê quán

    @Column(name = "phong_ban", length = 50)
    private String department; // Phòng ban

    @Column(name = "gioi_tinh", length = 20)
    private String gender; // Giới tính (Nam/Nữ)

    @Column(name = "duong_dan_hop_dong")
    private String contractFilePath; // Đường dẫn file hợp đồng

    @Column(name = "he_so_chuc_vu", precision = 19, scale = 2)
    private BigDecimal positionCoefficient = BigDecimal.ZERO; // Hệ số chức vụ: 0.4 - 1.0 (nhân lương tối thiểu)

    @Column(name = "phu_cap_tham_nien", precision = 19, scale = 2)
    private BigDecimal seniorityAllowance = BigDecimal.ZERO; // Phụ cấp thâm niên (cố định theo năm)

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Loại hình nhân sự không được để trống")
    @Column(name = "loai_nhan_vien", length = 50)
    private EmployeeType employeeType; // Loại hình nhân viên

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", length = 30)
    private EmployeeStatus status = EmployeeStatus.WORKING;

    @Column(name = "ngay_vao_lam")
    private LocalDate joinDate; // Ngày vào làm việc

    @Column(name = "ngay_nghi_viec")
    private LocalDate resignationDate; // Ngày nghỉ việc

    @Transient
    private boolean onLeave = false;

    public Employee(String id, String fullName, BigDecimal contractSalary, Integer dependentCount, EmployeeType type) {
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
