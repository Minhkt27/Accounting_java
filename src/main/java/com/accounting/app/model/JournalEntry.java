package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "but_toan_nhat_ky") // Bảng Bút toán nhật ký
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class JournalEntry extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id_chung_tu")
    private Voucher voucher; // Chứng từ

    @ManyToOne
    @JoinColumn(name = "ma_tai_khoan_no")
    private AccountCategory debitAccount; // Tài khoản nợ

    @ManyToOne
    @JoinColumn(name = "ma_tai_khoan_co")
    private AccountCategory creditAccount; // Tài khoản có

    @Column(name = "so_tien", precision = 19, scale = 2)
    private BigDecimal amount; // Số tiền

    @Column(name = "dien_giai")
    private String description; // Diễn giải/Mô tả

    public JournalEntry(Voucher voucher, AccountCategory debit, AccountCategory credit, BigDecimal amount, String description) {
        this.voucher = voucher;
        this.debitAccount = debit;
        this.creditAccount = credit;
        this.amount = amount;
        this.description = description;
    }
}
