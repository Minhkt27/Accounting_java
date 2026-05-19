package com.accounting.app.controller;

import com.accounting.app.dto.AttendanceBulkRequest;
import com.accounting.app.dto.AttendanceSuggestion;
import com.accounting.app.model.Attendance;
import com.accounting.app.model.Payroll;
import com.accounting.app.model.PayrollStatus;
import com.accounting.app.repository.AttendanceRepository;
import com.accounting.app.repository.PayrollRepository;
import com.accounting.app.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private AttendanceService attendanceService;
    @Autowired
    private PayrollRepository payrollRepository;

    @GetMapping("/{month}/{year}")
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public com.accounting.app.dto.PageResponse<Attendance> getByMonth(
            @PathVariable Integer month,
            @PathVariable Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Page<Attendance> result = attendanceRepository.findAllByMonthAndYearSorted(
                month, year, org.springframework.data.domain.PageRequest.of(page, size));
        return new com.accounting.app.dto.PageResponse<>(
                result.getContent(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast());
    }

    @PostMapping
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public List<Attendance> saveBulk(@RequestBody List<Attendance> attendances) {
        if (attendances == null)
            return List.of();

        if (!attendances.isEmpty()) {
            Attendance first = attendances.get(0);
            LocalDate now = LocalDate.now();
            int currentMonthValue = now.getYear() * 12 + now.getMonthValue();
            int targetMonthValue = first.getYear() * 12 + first.getMonth();

            if (targetMonthValue > currentMonthValue) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Không thể chấm công cho tháng trong tương lai.");
            }

            // Kiểm tra trạng thái bảng lương
            List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(first.getMonth(), first.getYear());
            boolean isLocked = !payrolls.isEmpty()
                    && payrolls.stream().anyMatch(p -> p.getStatus() != PayrollStatus.REJECTED);

            if (isLocked) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Bảng lương tháng " + first.getMonth() + "/" + first.getYear()
                                + " đã được tính. Vui lòng từ chối bảng lương nếu muốn sửa lại công.");
            }
        }

        for (Attendance att : attendances) {
            // Upsert logic: check if record exists for (employee, month, year)
            attendanceRepository.findByEmployeeIdAndMonthAndYear(
                    att.getEmployee().getId(), att.getMonth(), att.getYear())
                    .ifPresent(existing -> att.setId(existing.getId()));
        }

        return attendanceRepository.saveAll(attendances);
    }

    @GetMapping("/suggest")
    @PreAuthorize("@perm.check('HR_ATTENDANCE')")
    public ResponseEntity<AttendanceSuggestion> suggestRealWorkDays(
            @RequestParam String employeeId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @RequestParam BigDecimal standardDays) {
        AttendanceSuggestion suggestion = attendanceService.getAttendanceSuggestion(employeeId, month, year,
                standardDays);
        return ResponseEntity.ok(suggestion);
    }

    @PostMapping("/suggest-bulk")
    @PreAuthorize("hasRole('NHAN_SU') or hasRole('KE_TOAN_LUONG') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, AttendanceSuggestion>> suggestBulk(@RequestBody AttendanceBulkRequest request) {
        Map<String, AttendanceSuggestion> suggestions = attendanceService.getBulkSuggestions(
                request.getEmployeeIds(),
                request.getMonth(),
                request.getYear(),
                request.getStandardDays());
        return ResponseEntity.ok(suggestions);
    }
}
