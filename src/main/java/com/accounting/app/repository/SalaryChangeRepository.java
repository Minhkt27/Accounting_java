package com.accounting.app.repository;

import com.accounting.app.model.SalaryChange;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryChangeRepository extends JpaRepository<SalaryChange, Long> {
    Page<SalaryChange> findByStatus(String status, Pageable pageable);
    Page<SalaryChange> findByEmployeeId(String employeeId, Pageable pageable);
    @Query("SELECT s FROM SalaryChange s ORDER BY s.createdAt DESC NULLS LAST, s.id DESC")
    Page<SalaryChange> findAllSorted(Pageable pageable);
}
