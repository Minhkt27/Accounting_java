package com.accounting.app.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.EqualsAndHashCode;

@Entity
@Table(name = "journal_entries")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class JournalEntry extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    @ManyToOne
    @JoinColumn(name = "debit_account_id")
    private AccountCategory debitAccount;

    @ManyToOne
    @JoinColumn(name = "credit_account_id")
    private AccountCategory creditAccount;

    private Double amount;
    private String description;

    public JournalEntry(Voucher voucher, AccountCategory debit, AccountCategory credit, Double amount, String description) {
        this.voucher = voucher;
        this.debitAccount = debit;
        this.creditAccount = credit;
        this.amount = amount;
        this.description = description;
    }
}
