package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "journal_entries") // Bảng Bút toán nhật ký
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class JournalEntry extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "voucher_id")
    private Voucher voucher; // Chứng từ

    @ManyToOne
    @JoinColumn(name = "debit_account_id")
    private AccountCategory debitAccount; // Tài khoản nợ

    @ManyToOne
    @JoinColumn(name = "credit_account_id")
    private AccountCategory creditAccount; // Tài khoản có

    private Double amount; // Số tiền
    private String description; // Diễn giải/Mô tả

    public JournalEntry(Voucher voucher, AccountCategory debit, AccountCategory credit, Double amount, String description) {
        this.voucher = voucher;
        this.debitAccount = debit;
        this.creditAccount = credit;
        this.amount = amount;
        this.description = description;
    }
}
