package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "salary_changes") // Bảng Biến động lương
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SalaryChange extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee; // Nhân viên

    /**
     * Loại biến động:
     * SALARY_ADJUSTMENT - Điều chỉnh lương
     * PROMOTION - Thăng chức / Tăng bậc lương
     * REWARD - Khen thưởng
     * DISCIPLINE - Kỷ luật
     */
    private String changeType; // Loại thay đổi

    private Double oldValue;        // Giá trị cũ (lương cũ, hoặc 0 nếu thưởng/phạt)
    private Double newValue;        // Giá trị mới (lương mới, hoặc số tiền thưởng/phạt)
    private String reason;          // Lý do biến động
    private LocalDate effectiveDate; // Ngày hiệu lực

    /**
     * Trạng thái phê duyệt:
     * PENDING - Chờ phê duyệt
     * APPROVED - Đã phê duyệt
     * REJECTED - Đã từ chối
     */
    private String status = "PENDING"; // Trạng thái phê duyệt

    private String createdBy;       // Người tạo đề xuất
    private String approvedBy;      // Người phê duyệt / từ chối
    private LocalDateTime approvedAt; // Thời gian phê duyệt
    private String rejectionReason; // Lý do từ chối (nếu REJECTED)

    private Double newSeniorityAllowance; // Phụ cấp thâm niên mới

    @PrePersist
    protected void onCreate() {
        super.onCreate();
    }
}
