package com.accounting.app.controller;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

    @Autowired private VoucherRepository voucherRepo;
    @Autowired private JournalEntryRepository journalRepo;
    @Autowired private PayrollRepository payrollRepo;

    /**
     * UC21 - Danh sách chứng từ theo kỳ
     */
    @GetMapping("/vouchers")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getVouchers(
            @RequestParam Integer month, @RequestParam Integer year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        
        List<Voucher> vouchers = voucherRepo.findByTargetMonthAndTargetYear(month, year);
        
        List<Map<String, Object>> result = vouchers.stream().map(v -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", v.getId());
            map.put("voucherNumber", v.getVoucherNumber());
            map.put("type", v.getType());
            map.put("voucherDate", v.getVoucherDate());
            map.put("totalAmount", v.getTotalAmount());
            map.put("description", v.getDescription());
            map.put("createdAt", v.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    /**
     * UC22 - Sổ nhật ký chung (Journal entries)
     */
    @GetMapping("/journal")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getJournalEntries(
            @RequestParam Integer month, @RequestParam Integer year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        
        List<Voucher> vouchers = voucherRepo.findByTargetMonthAndTargetYear(month, year);
        List<JournalEntry> entries = journalRepo.findByVoucherIn(vouchers);
        
        List<Map<String, Object>> result = entries.stream().map(e -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("voucherNumber", e.getVoucher().getVoucherNumber());
            map.put("voucherDate", e.getVoucher().getVoucherDate());
            map.put("debitAccountId", e.getDebitAccount().getId());
            map.put("debitAccountName", e.getDebitAccount().getName());
            map.put("creditAccountId", e.getCreditAccount().getId());
            map.put("creditAccountName", e.getCreditAccount().getName());
            map.put("amount", e.getAmount());
            map.put("description", e.getDescription());
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Báo cáo tổng hợp thuế & bảo hiểm theo kỳ
     */
    @GetMapping("/summary")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW') or @perm.check('DASHBOARD_VIEW')")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestParam Integer month, @RequestParam Integer year) {
        List<Payroll> payrolls = payrollRepo.findByMonthAndYear(month, year);
        
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("month", month);
        summary.put("year", year);
        summary.put("employeeCount", payrolls.size());
        summary.put("totalGrossIncome", payrolls.stream().mapToDouble(p -> p.getGrossIncome() != null ? p.getGrossIncome() : 0).sum());
        summary.put("totalBaseSalary", payrolls.stream().mapToDouble(p -> p.getBaseSalaryPay() != null ? p.getBaseSalaryPay() : 0).sum());
        summary.put("totalMealAllowance", payrolls.stream().mapToDouble(p -> p.getMealAllowance() != null ? p.getMealAllowance() : 0).sum());
        summary.put("totalOtPay", payrolls.stream().mapToDouble(p -> p.getOtPay() != null ? p.getOtPay() : 0).sum());
        summary.put("totalBHXH", payrolls.stream().mapToDouble(p -> p.getBhxhNhanVien() != null ? p.getBhxhNhanVien() : 0).sum());
        summary.put("totalBHYT", payrolls.stream().mapToDouble(p -> p.getBhytNhanVien() != null ? p.getBhytNhanVien() : 0).sum());
        summary.put("totalBHTN", payrolls.stream().mapToDouble(p -> p.getBhtnNhanVien() != null ? p.getBhtnNhanVien() : 0).sum());
        summary.put("totalInsurance", payrolls.stream().mapToDouble(p -> p.getTotalInsurance() != null ? p.getTotalInsurance() : 0).sum());
        summary.put("totalEmployerInsurance", payrolls.stream().mapToDouble(p -> p.getTotalEmployerInsurance() != null ? p.getTotalEmployerInsurance() : 0).sum());
        summary.put("totalTax", payrolls.stream().mapToDouble(p -> p.getTaxAmount() != null ? p.getTaxAmount() : 0).sum());
        summary.put("totalNetPay", payrolls.stream().mapToDouble(p -> p.getNetPay() != null ? p.getNetPay() : 0).sum());
        
        // Chi tiết từng nhân viên cho bảng báo cáo
        List<Map<String, Object>> details = payrolls.stream().map(p -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("employeeId", p.getEmployee().getId());
            d.put("fullName", p.getEmployee().getFullName());
            d.put("grossIncome", p.getGrossIncome());
            d.put("bhxh", p.getBhxhNhanVien());
            d.put("bhyt", p.getBhytNhanVien());
            d.put("bhtn", p.getBhtnNhanVien());
            d.put("totalInsurance", p.getTotalInsurance());
            d.put("totalEmployerInsurance", p.getTotalEmployerInsurance());
            d.put("taxableIncome", p.getTaxableIncome());
            d.put("taxAmount", p.getTaxAmount());
            d.put("netPay", p.getNetPay());
            d.put("status", p.getStatus());
            return d;
        }).collect(Collectors.toList());
        
        summary.put("details", details);
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Thu thập dữ liệu biến động lương 6 tháng gần nhất cho Dashboard
     */
    @GetMapping("/trend")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW') or @perm.check('DASHBOARD_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getSalaryTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate now = LocalDate.now();
        
        for (int i = 5; i >= 0; i--) {
            LocalDate target = now.minusMonths(i);
            int m = target.getMonthValue();
            int y = target.getYear();
            
            List<Payroll> payrolls = payrollRepo.findByMonthAndYear(m, y);
            double totalNet = payrolls.stream().mapToDouble(p -> p.getNetPay() != null ? p.getNetPay() : 0).sum();
            
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("name", "Tháng " + m + "/" + (y % 100));
            data.put("value", totalNet);
            trend.add(data);
        }
        
        return ResponseEntity.ok(trend);
    }

    /**
     * UC23 - Sổ cái (General Ledger per Account)
     */
    @GetMapping("/ledger/{accountId}")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> getLedgerEntries(
            @PathVariable String accountId,
            @RequestParam Integer month, @RequestParam Integer year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        
        List<Voucher> vouchers = voucherRepo.findByTargetMonthAndTargetYear(month, year);
        List<JournalEntry> entries = journalRepo.findByVoucherIn(vouchers);
        
        // Lọc các bút toán có liên quan đến tài khoản này (Nợ hoặc Có)
        List<Map<String, Object>> result = entries.stream()
            .filter(e -> e.getDebitAccount().getId().equals(accountId) || e.getCreditAccount().getId().equals(accountId))
            .map(e -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", e.getId());
                map.put("voucherNumber", e.getVoucher().getVoucherNumber());
                map.put("voucherDate", e.getVoucher().getVoucherDate());
                map.put("description", e.getDescription());
                map.put("oppositeAccount", e.getDebitAccount().getId().equals(accountId) ? e.getCreditAccount().getId() : e.getDebitAccount().getId());
                map.put("debit", e.getDebitAccount().getId().equals(accountId) ? e.getAmount() : 0.0);
                map.put("credit", e.getCreditAccount().getId().equals(accountId) ? e.getAmount() : 0.0);
                return map;
            }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Báo cáo chi tiết Bảo hiểm (BHXH, BHYT, BHTN) theo kỳ
     */
    @GetMapping("/report/insurance")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<Map<String, Object>> getInsuranceReport(
            @RequestParam Integer month, @RequestParam Integer year) {
        List<Payroll> payrolls = payrollRepo.findByMonthAndYear(month, year);
        
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("employeeCount", payrolls.size());
        
        // Tổng hợp phần NLĐ đóng
        report.put("totalBhxhEE", payrolls.stream().mapToDouble(p -> p.getBhxhNhanVien() != null ? p.getBhxhNhanVien() : 0).sum());
        report.put("totalBhytEE", payrolls.stream().mapToDouble(p -> p.getBhytNhanVien() != null ? p.getBhytNhanVien() : 0).sum());
        report.put("totalBhtnEE", payrolls.stream().mapToDouble(p -> p.getBhtnNhanVien() != null ? p.getBhtnNhanVien() : 0).sum());
        report.put("totalEE", payrolls.stream().mapToDouble(p -> p.getTotalInsurance() != null ? p.getTotalInsurance() : 0).sum());
        
        // Tổng hợp phần DN đóng
        report.put("totalBhxhER", payrolls.stream().mapToDouble(p -> p.getBhxhCongTy() != null ? p.getBhxhCongTy() : 0).sum());
        report.put("totalBhytER", payrolls.stream().mapToDouble(p -> p.getBhytCongTy() != null ? p.getBhytCongTy() : 0).sum());
        report.put("totalBhtnER", payrolls.stream().mapToDouble(p -> p.getBhtnCongTy() != null ? p.getBhtnCongTy() : 0).sum());
        report.put("totalKpcd", payrolls.stream().mapToDouble(p -> p.getKpcdCongTy() != null ? p.getKpcdCongTy() : 0).sum());
        report.put("totalER", payrolls.stream().mapToDouble(p -> p.getTotalEmployerInsurance() != null ? p.getTotalEmployerInsurance() : 0).sum());
        
        // Chi tiết từng nhân viên
        List<Map<String, Object>> details = payrolls.stream().map(p -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("employeeId", p.getEmployee().getId());
            d.put("fullName", p.getEmployee().getFullName());
            d.put("contractSalary", p.getContractSalary());
            d.put("bhxhEE", p.getBhxhNhanVien());
            d.put("bhytEE", p.getBhytNhanVien());
            d.put("bhtnEE", p.getBhtnNhanVien());
            d.put("totalEE", p.getTotalInsurance());
            d.put("bhxhER", p.getBhxhCongTy());
            d.put("bhytER", p.getBhytCongTy());
            d.put("bhtnER", p.getBhtnCongTy());
            d.put("kpcd", p.getKpcdCongTy());
            d.put("totalER", p.getTotalEmployerInsurance());
            return d;
        }).collect(Collectors.toList());
        report.put("details", details);
        
        return ResponseEntity.ok(report);
    }

    /**
     * Báo cáo chi tiết Thuế TNCN theo kỳ
     */
    @GetMapping("/report/tax")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<Map<String, Object>> getTaxReport(
            @RequestParam Integer month, @RequestParam Integer year) {
        List<Payroll> payrolls = payrollRepo.findByMonthAndYear(month, year);
        
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("employeeCount", payrolls.size());
        report.put("totalTaxableIncome", payrolls.stream().mapToDouble(p -> p.getTaxableIncome() != null ? p.getTaxableIncome() : 0).sum());
        report.put("totalTaxAmount", payrolls.stream().mapToDouble(p -> p.getTaxAmount() != null ? p.getTaxAmount() : 0).sum());
        
        List<Map<String, Object>> details = payrolls.stream().map(p -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("employeeId", p.getEmployee().getId());
            d.put("fullName", p.getEmployee().getFullName());
            d.put("grossIncome", p.getGrossIncome());
            d.put("totalInsurance", p.getTotalInsurance());
            d.put("taxableIncome", p.getTaxableIncome());
            d.put("taxAmount", p.getTaxAmount());
            d.put("netPay", p.getNetPay());
            d.put("dependentCount", p.getEmployee().getDependentCount());
            return d;
        }).collect(Collectors.toList());
        report.put("details", details);
        
        return ResponseEntity.ok(report);
    }

    /**
     * Báo cáo Kinh phí Công đoàn theo kỳ
     */
    @GetMapping("/report/union-fee")
    @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
    public ResponseEntity<Map<String, Object>> getUnionFeeReport(
            @RequestParam Integer month, @RequestParam Integer year) {
        List<Payroll> payrolls = payrollRepo.findByMonthAndYear(month, year);
        
        double totalContractSalary = payrolls.stream().mapToDouble(p -> p.getContractSalary() != null ? p.getContractSalary() : 0).sum();
        double totalKpcd = payrolls.stream().mapToDouble(p -> p.getKpcdCongTy() != null ? p.getKpcdCongTy() : 0).sum();
        
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("month", month);
        report.put("year", year);
        report.put("employeeCount", payrolls.size());
        report.put("totalContractSalary", totalContractSalary);
        report.put("unionFeeRate", 2.0);
        report.put("totalUnionFee", totalKpcd);
        
        List<Map<String, Object>> details = payrolls.stream().map(p -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("employeeId", p.getEmployee().getId());
            d.put("fullName", p.getEmployee().getFullName());
            d.put("contractSalary", p.getContractSalary());
            d.put("kpcd", p.getKpcdCongTy());
            return d;
        }).collect(Collectors.toList());
        report.put("details", details);
        
        return ResponseEntity.ok(report);
    }
}
