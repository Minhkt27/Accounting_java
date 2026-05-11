package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "chung_tu") // Bảng Chứng từ
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Voucher extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "so_chung_tu")
    private String voucherNumber; // Số chứng từ (Ví dụ: PC001/03-24)

    @Column(name = "loai_chung_tu")
    private String type;          // Loại chứng từ (PHIEU_CHI, UNC)

    @Column(name = "ngay_lap")
    private LocalDate voucherDate; // Ngày lập chứng từ

    @Column(name = "tong_so_tien")
    private Double totalAmount; // Tổng số tiền

    @Column(name = "dien_giai")
    private String description; // Diễn giải/Mô tả

    @Column(name = "thang_hach_toan")
    private Integer targetMonth; // Kỳ hạch toán (tháng)

    @Column(name = "nam_hach_toan")
    private Integer targetYear;  // Kỳ hạch toán (năm)

    @Column(name = "trang_thai")
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
