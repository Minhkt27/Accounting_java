package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "cau_hinh_thue_nhan_vien") // Bảng Cấu hình thuế nhân viên
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeTaxConfig extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "loai_nhan_vien")
    private EmployeeType employeeType; // Loại hình nhân viên

    @Enumerated(EnumType.STRING)
    @Column(name = "phuong_phap_tinh_thue")
    private TaxMethod taxMethod = TaxMethod.PROGRESSIVE; // Phương pháp tính thuế

    @Column(name = "trang_thai")
    private String status = "APPROVED"; // Trạng thái (APPROVED, PENDING)
}
