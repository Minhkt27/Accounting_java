package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.Attendance;
import java.util.Optional;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmployeeIdAndMonthAndYear(String employeeId, Integer month, Integer year);
    List<Attendance> findAllByMonthAndYear(Integer month, Integer year);
}
