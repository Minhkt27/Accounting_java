package com.accounting.app.repository;

import com.accounting.app.model.Payroll;
import com.accounting.app.model.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payroll p JOIN p.employee e WHERE p.month = :month AND p.year = :year ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Payroll> findByMonthAndYearSorted(@org.springframework.data.repository.query.Param("month") Integer month, @org.springframework.data.repository.query.Param("year") Integer year, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payroll p JOIN p.employee e WHERE p.month = :month AND p.year = :year ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    List<Payroll> findByMonthAndYearSortedList(@org.springframework.data.repository.query.Param("month") Integer month, @org.springframework.data.repository.query.Param("year") Integer year);
    Optional<Payroll> findByEmployeeIdAndMonthAndYear(String employeeId, Integer month, Integer year);
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payroll p JOIN p.employee e WHERE p.status = :status ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Payroll> findByStatusSorted(@org.springframework.data.repository.query.Param("status") PayrollStatus status, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Payroll p JOIN p.employee e WHERE p.status = :status ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    List<Payroll> findByStatusSortedList(@org.springframework.data.repository.query.Param("status") PayrollStatus status);
}
