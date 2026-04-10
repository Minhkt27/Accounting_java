package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.JournalEntry;
import com.accounting.app.model.Voucher;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    Page<JournalEntry> findByVoucherIn(List<Voucher> vouchers, Pageable pageable);
    
    @Query("SELECT j FROM JournalEntry j WHERE j.voucher IN :vouchers AND (j.debitAccount.id = :accountId OR j.creditAccount.id = :accountId)")
    Page<JournalEntry> findByVoucherInAndAccount(
        @Param("vouchers") List<Voucher> vouchers, 
        @Param("accountId") String accountId, 
        Pageable pageable
    );

    @Query("SELECT j FROM JournalEntry j WHERE j.voucher IN :vouchers AND (j.debitAccount.id = :accountId OR j.creditAccount.id = :accountId)")
    List<JournalEntry> findByVoucherInAndAccountList(
        @Param("vouchers") List<Voucher> vouchers, 
        @Param("accountId") String accountId
    );

    List<JournalEntry> findByVoucherIn(List<Voucher> vouchers);
    List<JournalEntry> findByVoucher(Voucher voucher);
}
