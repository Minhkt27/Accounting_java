package com.accounting.app.repository;

import com.accounting.app.model.SalaryChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SalaryChangeRepository extends JpaRepository<SalaryChange, Long> {
    List<SalaryChange> findByStatus(String status);
    List<SalaryChange> findByEmployeeId(String employeeId);
    List<SalaryChange> findAllByOrderByCreatedAtDesc();
}
