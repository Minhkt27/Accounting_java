package com.accounting.app.repository;

import com.accounting.app.model.Payroll;
import com.accounting.app.model.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByMonthAndYear(Integer month, Integer year);
    Optional<Payroll> findByEmployeeIdAndMonthAndYear(String employeeId, Integer month, Integer year);
    List<Payroll> findByStatus(PayrollStatus status);
}
