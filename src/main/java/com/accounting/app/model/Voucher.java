package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "vouchers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Voucher extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String voucherNumber; // Ví dụ: PC001/03-24
    private String type;          // PHIEU_CHI, UNC
    private LocalDate voucherDate;
    private Double totalAmount;
    private String description;
    private Integer targetMonth; // Kỳ hạch toán (tháng)
    private Integer targetYear;  // Kỳ hạch toán (năm)
    private String status = "PENDING";

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
