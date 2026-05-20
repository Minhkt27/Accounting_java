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
    
    @Query("SELECT s FROM SalaryChange s WHERE s.employee.id = :employeeId AND s.status = 'APPROVED' AND s.effectiveDate >= :start AND s.effectiveDate <= :end")
    java.util.List<SalaryChange> findApprovedInMonth(
        @org.springframework.data.repository.query.Param("employeeId") String employeeId, 
        @org.springframework.data.repository.query.Param("start") java.time.LocalDate start, 
        @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);

    @Query("SELECT s FROM SalaryChange s WHERE s.status = 'APPROVED' AND s.effectiveDate >= :start AND s.effectiveDate <= :end")
    java.util.List<SalaryChange> findAllApprovedInMonth(
        @org.springframework.data.repository.query.Param("start") java.time.LocalDate start, 
        @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);

    @Query("SELECT s FROM SalaryChange s WHERE s.status = 'APPROVED' AND (s.changeType = 'SALARY_ADJUSTMENT' OR s.changeType = 'PROMOTION') ORDER BY s.effectiveDate ASC, s.id ASC")
    java.util.List<SalaryChange> findAllApprovedSalaryAdjustments();

    @Query("SELECT s FROM SalaryChange s ORDER BY s.createdAt DESC NULLS LAST, s.id DESC")
    Page<SalaryChange> findAllSorted(Pageable pageable);
}
