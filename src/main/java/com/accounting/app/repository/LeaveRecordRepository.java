package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.LeaveRecord;
import java.util.List;

@Repository
public interface LeaveRecordRepository extends JpaRepository<LeaveRecord, Long> {
    List<LeaveRecord> findAllByEmployeeId(String employeeId);

    @org.springframework.data.jpa.repository.Query("SELECT lr FROM LeaveRecord lr WHERE lr.startDate <= :date AND lr.endDate >= :date")
    List<LeaveRecord> findActiveLeaves(@org.springframework.data.repository.query.Param("date") java.time.LocalDate date);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(lr) > 0 FROM LeaveRecord lr WHERE lr.employee.id = :empId AND lr.startDate <= :end AND lr.endDate >= :start")
    boolean existsByEmployeeIdAndOverlap(@org.springframework.data.repository.query.Param("empId") String empId, @org.springframework.data.repository.query.Param("start") java.time.LocalDate start, @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(lr) > 0 FROM LeaveRecord lr WHERE lr.employee.id = :empId AND lr.id <> :excludeId AND lr.startDate <= :end AND lr.endDate >= :start")
    boolean existsByEmployeeIdAndOverlapExcludingId(@org.springframework.data.repository.query.Param("empId") String empId, @org.springframework.data.repository.query.Param("excludeId") Long excludeId, @org.springframework.data.repository.query.Param("start") java.time.LocalDate start, @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);

    @org.springframework.data.jpa.repository.Query("SELECT lr FROM LeaveRecord lr WHERE lr.startDate <= :end AND lr.endDate >= :start")
    List<LeaveRecord> findLeavesInPeriod(@org.springframework.data.repository.query.Param("start") java.time.LocalDate start, @org.springframework.data.repository.query.Param("end") java.time.LocalDate end);
}
