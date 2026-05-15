package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "bien_dong_luong") // Bảng Biến động lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SalaryChange extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ma_nhan_vien")
    private Employee employee; // Nhân viên

    @Column(name = "loai_bien_dong")
    private String changeType; // Loại thay đổi

    @Column(name = "gia_tri_cu", precision = 19, scale = 2)
    private BigDecimal oldValue;        // Giá trị cũ (lương cũ, hoặc 0 nếu thưởng/phạt)

    @Column(name = "gia_tri_moi", precision = 19, scale = 2)
    private BigDecimal newValue;        // Giá trị mới (lương mới, hoặc số tiền thưởng/phạt)

    @Column(name = "ly_do")
    private String reason;          // Lý do biến động

    @Column(name = "ngay_hieu_luc")
    private LocalDate effectiveDate; // Ngày hiệu lực

    @Column(name = "trang_thai")
    private String status = "PENDING"; // Trạng thái phê duyệt

    @Column(name = "nguoi_tao")
    private String createdBy;       // Người tạo đề xuất

    @Column(name = "nguoi_duyet")
    private String approvedBy;      // Người phê duyệt / từ chối

    @Column(name = "ngay_duyet")
    private LocalDateTime approvedAt; // Thời gian phê duyệt

    @Column(name = "ly_do_tu_choi")
    private String rejectionReason; // Lý do từ chối (nếu REJECTED)

    @Column(name = "phu_cap_tham_nien_moi", precision = 19, scale = 2)
    private BigDecimal newSeniorityAllowance; // Phụ cấp thâm niên mới

    @PrePersist
    protected void onCreate() {
        super.onCreate();
    }
}
