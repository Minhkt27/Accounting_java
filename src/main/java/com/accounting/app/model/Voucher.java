package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "vouchers") // Bảng Chứng từ
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Voucher extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String voucherNumber; // Số chứng từ (Ví dụ: PC001/03-24)
    private String type;          // Loại chứng từ (PHIEU_CHI, UNC)
    private LocalDate voucherDate; // Ngày lập chứng từ
    private Double totalAmount; // Tổng số tiền
    private String description; // Diễn giải/Mô tả
    private Integer targetMonth; // Kỳ hạch toán (tháng)
    private Integer targetYear;  // Kỳ hạch toán (năm)
    private String status = "PENDING"; // Trạng thái

    @PrePersist
    protected void onCreate() {
        super.onCreate();
    }

    public Voucher(String voucherNumber, String type, LocalDate date, Double amount, String description) {
        this.voucherNumber = voucherNumber;
        this.type = type;
        this.voucherDate = date;
        this.totalAmount = amount;
        this.description = description;
    }
}
