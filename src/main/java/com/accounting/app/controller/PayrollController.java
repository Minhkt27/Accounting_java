package com.accounting.app.controller;

import com.accounting.app.model.Payroll;
import com.accounting.app.repository.PayrollRepository;
import com.accounting.app.service.PayrollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    @Autowired private PayrollService payrollService;
    @Autowired private PayrollRepository payrollRepository;

    @PostMapping("/calculate")
    @PreAuthorize("@perm.check('PAYROLL_CALCULATE')")
    public ResponseEntity<String> calculatePayroll(@RequestParam Integer month, @RequestParam Integer year) {
        try {
            payrollService.calculateMonthlyPayroll(month, year);
            return ResponseEntity.ok("Tính lương thành công cho tháng " + month + "/" + year);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/{month}/{year}")
    @PreAuthorize("@perm.check('PAYROLL_CALCULATE')")
    public com.accounting.app.dto.PageResponse<Payroll> getPayrollByMonth(
            @PathVariable Integer month, 
            @PathVariable Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Page<Payroll> result = payrollRepository.findByMonthAndYearSorted(
            month, year, org.springframework.data.domain.PageRequest.of(page, size)
        );
        return new com.accounting.app.dto.PageResponse<>(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.isLast()
        );
    }

    @PostMapping("/approve")
    @PreAuthorize("@perm.check('PAYROLL_APPROVE')")
    public ResponseEntity<String> approvePayroll(@RequestParam Integer month, @RequestParam Integer year) {
        try {
            payrollService.approveMonthlyPayroll(month, year);
            return ResponseEntity.ok("Phê duyệt bảng lương tháng " + month + "/" + year + " thành công.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    @PostMapping("/pay")
    @PreAuthorize("@perm.check('PAYROLL_APPROVE')")
    public ResponseEntity<String> payPayroll(@RequestParam Integer month, @RequestParam Integer year, @RequestParam String paymentMethod) {
        try {
            payrollService.payMonthlyPayroll(month, year, paymentMethod);
            return ResponseEntity.ok("Thanh toán lương tháng " + month + "/" + year + " thành công.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    @PostMapping("/reject")
    @PreAuthorize("@perm.check('PAYROLL_APPROVE')")
    public ResponseEntity<String> rejectPayroll(
            @RequestParam Integer month, 
            @RequestParam Integer year,
            @RequestParam(required = false, defaultValue = "Không đạt yêu cầu") String reason) {
        try {
            payrollService.rejectMonthlyPayroll(month, year, reason);
            return ResponseEntity.ok("Đã từ chối bảng lương tháng " + month + "/" + year + ". Lý do: " + reason);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/pending-count")
    @PreAuthorize("@perm.check('PAYROLL_APPROVE')")
    public ResponseEntity<Long> getPendingCount() {
        long count = payrollRepository.findByStatusSortedList(com.accounting.app.model.PayrollStatus.DRAFT).size();
        return ResponseEntity.ok(count);
    }
}
