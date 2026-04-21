package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.Attendance;
import java.util.Optional;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndMonthAndYear(String employeeId, Integer month, Integer year);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Attendance a JOIN a.employee e WHERE a.month = :month AND a.year = :year ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Attendance> findAllByMonthAndYearSorted(
            @org.springframework.data.repository.query.Param("month") Integer month,
            @org.springframework.data.repository.query.Param("year") Integer year,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Attendance a JOIN a.employee e WHERE a.month = :month AND a.year = :year ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    List<Attendance> findAllByMonthAndYearSortedList(
            @org.springframework.data.repository.query.Param("month") Integer month,
            @org.springframework.data.repository.query.Param("year") Integer year);
}
