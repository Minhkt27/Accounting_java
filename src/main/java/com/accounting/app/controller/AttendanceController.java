package com.accounting.app.controller;

import com.accounting.app.dto.AttendanceBulkRequest;
import com.accounting.app.dto.AttendanceSuggestion;
import com.accounting.app.model.Attendance;
import com.accounting.app.repository.AttendanceRepository;
import com.accounting.app.repository.EmployeeRepository;
import com.accounting.app.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private AttendanceService attendanceService;

    @GetMapping("/{month}/{year}")
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public List<Attendance> getByMonth(@PathVariable Integer month, @PathVariable Integer year) {
        return attendanceRepository.findAllByMonthAndYear(month, year);
    }

    @PostMapping
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public List<Attendance> saveBulk(@RequestBody List<Attendance> attendances) {
        if (attendances == null) return List.of();
        
        if (!attendances.isEmpty()) {
            Attendance first = attendances.get(0);
            /* Temporarily disabled for testing
            LocalDate now = LocalDate.now();
            int currentMonthValue = now.getYear() * 12 + now.getMonthValue();
            int targetMonthValue = first.getYear() * 12 + first.getMonth();

            if (targetMonthValue >= currentMonthValue) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST, 
                    "Không thể chốt công cho tháng đang diễn ra hoặc chưa tới."
                );
            }
            */
        }

        for (Attendance att : attendances) {
            // Upsert logic: check if record exists for (employee, month, year)
            attendanceRepository.findByEmployeeIdAndMonthAndYear(
                att.getEmployee().getId(), att.getMonth(), att.getYear()
            ).ifPresent(existing -> att.setId(existing.getId()));
        }
        
        return attendanceRepository.saveAll(attendances);
    }

    @GetMapping("/suggest")
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public ResponseEntity<AttendanceSuggestion> suggestRealWorkDays(
            @RequestParam String employeeId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestParam Double standardDays) {
        AttendanceSuggestion suggestion = attendanceService.getAttendanceSuggestion(employeeId, month, year, standardDays);
        return ResponseEntity.ok(suggestion);
    }

    @PostMapping("/suggest-bulk")
    @PreAuthorize("hasRole('NHAN_SU') or hasRole('KE_TOAN_LUONG') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, AttendanceSuggestion>> suggestBulk(@RequestBody AttendanceBulkRequest request) {
        Map<String, AttendanceSuggestion> suggestions = attendanceService.getBulkSuggestions(
            request.getEmployeeIds(),
            request.getMonth(),
            request.getYear(),
            request.getStandardDays()
        );
        return ResponseEntity.ok(suggestions);
    }
}
