package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.JournalEntry;
import com.accounting.app.model.Voucher;

import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByVoucherIn(List<Voucher> vouchers);
    List<JournalEntry> findByVoucher(Voucher voucher);
}
