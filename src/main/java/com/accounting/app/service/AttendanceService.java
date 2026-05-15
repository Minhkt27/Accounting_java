package com.accounting.app.service;

import com.accounting.app.model.LeaveRecord;
import com.accounting.app.model.LeaveType;
import com.accounting.app.repository.LeaveRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.accounting.app.dto.AttendanceSuggestion;

@Service
public class AttendanceService {

    @Autowired
    private LeaveRecordRepository leaveRecordRepository;

    /**
     * Tính toán gợi ý chấm công hàng loạt cho danh sách nhân viên.
     */
    public Map<String, AttendanceSuggestion> getBulkSuggestions(List<String> employeeIds, Integer month, Integer year,
            BigDecimal standardDays) {
        // Tải toàn bộ đơn nghỉ liên quan 1 lần duy nhất để tối ưu hiệu năng
        List<LeaveRecord> allLeaves = leaveRecordRepository.findAll().stream()
                .filter(l -> employeeIds.contains(l.getEmployee().getId()))
                .filter(l -> isWithinMonth(l, month, year))
                .toList();

        Map<String, List<LeaveRecord>> leavesByEmp = allLeaves.stream()
                .collect(Collectors.groupingBy(l -> l.getEmployee().getId()));

        Map<String, AttendanceSuggestion> results = new HashMap<>();
        for (String empId : employeeIds) {
            List<LeaveRecord> empLeaves = leavesByEmp.getOrDefault(empId, List.of());
            BigDecimal allOffDays = BigDecimal.ZERO;
            BigDecimal paidLeaveDays = BigDecimal.ZERO;
            for (LeaveRecord leave : empLeaves) {
                BigDecimal days = calculateDaysInMonth(leave, month, year);
                allOffDays = allOffDays.add(days);
                if (leave.getLeaveType() == LeaveType.ANNUAL) {
                    paidLeaveDays = paidLeaveDays.add(days);
                }
            }

            BigDecimal physicalDays = standardDays.subtract(allOffDays);
            if (physicalDays.compareTo(BigDecimal.ZERO) < 0)
                physicalDays = BigDecimal.ZERO;
            if (physicalDays.compareTo(standardDays) > 0)
                physicalDays = standardDays;

            results.put(empId, new AttendanceSuggestion(physicalDays, paidLeaveDays));
        }
        return results;
    }

    /**
     * Tính toán gợi ý chấm công:
     * - physicalDays: Số ngày thực tế đi làm (Standard - Tất cả các loại nghỉ).
     * - paidLeaveDays: Số ngày nghỉ vẫn được hưởng lương (ANNUAL).
     */
    public AttendanceSuggestion getAttendanceSuggestion(String employeeId, Integer month, Integer year,
            BigDecimal standardDays) {
        List<LeaveRecord> leaves = leaveRecordRepository.findAll().stream()
                .filter(l -> l.getEmployee().getId().equals(employeeId))
                .filter(l -> isWithinMonth(l, month, year))
                .toList();

        BigDecimal allOffDays = BigDecimal.ZERO;
        BigDecimal paidLeaveDays = BigDecimal.ZERO;
        for (LeaveRecord leave : leaves) {
            BigDecimal days = calculateDaysInMonth(leave, month, year);
            allOffDays = allOffDays.add(days);
            if (leave.getLeaveType() == LeaveType.ANNUAL) {
                paidLeaveDays = paidLeaveDays.add(days);
            }
        }

        BigDecimal physicalDays = standardDays.subtract(allOffDays);
        if (physicalDays.compareTo(BigDecimal.ZERO) < 0)
            physicalDays = BigDecimal.ZERO;
        if (physicalDays.compareTo(standardDays) > 0)
            physicalDays = standardDays;

        return new AttendanceSuggestion(physicalDays, paidLeaveDays);
    }

    private boolean isWithinMonth(LeaveRecord leave, int month, int year) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        return !leave.getStartDate().isAfter(endOfMonth) && !leave.getEndDate().isBefore(startOfMonth);
    }

    private BigDecimal calculateDaysInMonth(LeaveRecord leave, int month, int year) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        LocalDate actualStart = leave.getStartDate().isBefore(startOfMonth) ? startOfMonth : leave.getStartDate();
        LocalDate actualEnd = leave.getEndDate().isAfter(endOfMonth) ? endOfMonth : leave.getEndDate();

        // Đếm số ngày làm việc (T2-T6) trong khoảng này
        int count = 0;
        LocalDate current = actualStart;
        while (!current.isAfter(actualEnd)) {
            if (current.getDayOfWeek().getValue() >= 1 && current.getDayOfWeek().getValue() <= 5) {
                count++;
            }
            current = current.plusDays(1);
        }
        return new BigDecimal(count);
    }
}
