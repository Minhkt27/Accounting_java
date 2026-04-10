package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.Voucher;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByVoucherDateBetween(LocalDate start, LocalDate end);
    org.springframework.data.domain.Page<Voucher> findByTargetMonthAndTargetYear(Integer targetMonth, Integer targetYear, org.springframework.data.domain.Pageable pageable);
    java.util.List<Voucher> findByTargetMonthAndTargetYear(Integer targetMonth, Integer targetYear);
}
