package com.accounting.app.controller;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounting")
public class AccountingController {

        @Autowired
        private VoucherRepository voucherRepo;
        @Autowired
        private JournalEntryRepository journalRepo;
        @Autowired
        private PayrollRepository payrollRepo;
        @Autowired
        private EmployeeRepository employeeRepo;

        @GetMapping("/report/all")
        @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
        public ResponseEntity<Map<String, Object>> getAllReports(@RequestParam Integer month,
                        @RequestParam Integer year) {
                Map<String, Object> all = new LinkedHashMap<>();
                all.put("summary", getSummary(month, year).getBody());
                all.put("insurance", getInsuranceReport(month, year).getBody());
                all.put("tax", getTaxReport(month, year).getBody());
                all.put("union", getUnionFeeReport(month, year).getBody());
                return ResponseEntity.ok(all);
        }

        /**
         * UC21 - Danh sách chứng từ theo kỳ
         */
        @GetMapping("/vouchers")
        @PreAuthorize("@perm.check('ACCOUNTING_VIEW') or @perm.check('PAYROLL_PAY')")
        public ResponseEntity<com.accounting.app.dto.PageResponse<Map<String, Object>>> getVouchers(
                        @RequestParam Integer month,
                        @RequestParam Integer year,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                org.springframework.data.domain.Page<Voucher> pageResult = voucherRepo.findByTargetMonthAndTargetYear(
                                month, year, org.springframework.data.domain.PageRequest.of(page, size));

                List<Map<String, Object>> content = pageResult.getContent().stream().map(v -> {
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

                return ResponseEntity.ok(new com.accounting.app.dto.PageResponse<>(
                                content,
                                pageResult.getNumber(),
                                pageResult.getSize(),
                                pageResult.getTotalElements(),
                                pageResult.getTotalPages(),
                                pageResult.isLast()));
        }

        /**
         * UC22 - Sổ nhật ký chung (Journal entries)
         */
        @GetMapping("/journal")
        @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
        public ResponseEntity<com.accounting.app.dto.PageResponse<Map<String, Object>>> getJournalEntries(
                        @RequestParam Integer month,
                        @RequestParam Integer year,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                List<Voucher> vouchers = voucherRepo.findByTargetMonthAndTargetYear(month, year);
                if (vouchers.isEmpty()) {
                        return ResponseEntity.ok(
                                        new com.accounting.app.dto.PageResponse<>(List.of(), page, size, 0, 0, true));
                }

                org.springframework.data.domain.Page<JournalEntry> pageResult = journalRepo.findByVoucherIn(
                                vouchers, org.springframework.data.domain.PageRequest.of(page, size));

                List<Map<String, Object>> content = pageResult.getContent().stream().map(e -> {
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

                return ResponseEntity.ok(new com.accounting.app.dto.PageResponse<>(
                                content,
                                pageResult.getNumber(),
                                pageResult.getSize(),
                                pageResult.getTotalElements(),
                                pageResult.getTotalPages(),
                                pageResult.isLast()));
        }

        /**
         * Báo cáo tổng hợp thuế & bảo hiểm theo kỳ
         */
        @GetMapping("/summary")
        @PreAuthorize("@perm.check('ACCOUNTING_VIEW') or @perm.check('DASHBOARD_VIEW')")
        public ResponseEntity<Map<String, Object>> getSummary(
                        @RequestParam Integer month, @RequestParam Integer year) {
                List<Payroll> payrolls = payrollRepo.findByMonthAndYearSortedList(month, year).stream()
                                .filter(p -> p.getStatus() == PayrollStatus.APPROVED
                                                || p.getStatus() == PayrollStatus.PAID)
                                .collect(Collectors.toList());

                Map<String, Object> summary = new LinkedHashMap<>();
                summary.put("month", month);
                summary.put("year", year);
                summary.put("employeeCount", payrollRepo.countByMonthAndYear(month, year));
                summary.put("activeEmployeeCount", employeeRepo.countActive());
                summary.put("totalGrossIncome",
                                payrolls.stream().map(
                                                p -> p.getGrossIncome() != null ? p.getGrossIncome() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalBaseSalary",
                                payrolls.stream()
                                                .map(p -> p.getBaseSalaryPay() != null ? p.getBaseSalaryPay()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalMealAllowance",
                                payrolls.stream()
                                                .map(p -> p.getMealAllowance() != null ? p.getMealAllowance()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalOtPay",
                                payrolls.stream().map(p -> p.getOtPay() != null ? p.getOtPay() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalBHXH",
                                payrolls.stream()
                                                .map(p -> p.getBhxhNhanVien() != null ? p.getBhxhNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalBHYT",
                                payrolls.stream()
                                                .map(p -> p.getBhytNhanVien() != null ? p.getBhytNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalBHTN",
                                payrolls.stream()
                                                .map(p -> p.getBhtnNhanVien() != null ? p.getBhtnNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalInsurance",
                                payrolls.stream()
                                                .map(p -> p.getTotalInsurance() != null ? p.getTotalInsurance()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalEmployerInsurance", payrolls.stream()
                                .map(p -> p.getTotalEmployerInsurance() != null ? p.getTotalEmployerInsurance()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalTax",
                                payrolls.stream()
                                                .map(p -> p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                summary.put("totalNetPay",
                                payrolls.stream().map(p -> p.getNetPay() != null ? p.getNetPay() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));

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

                        List<Payroll> payrolls = payrollRepo.findByMonthAndYearSortedList(m, y).stream()
                                        .filter(p -> p.getStatus() == PayrollStatus.APPROVED
                                                        || p.getStatus() == PayrollStatus.PAID)
                                        .collect(Collectors.toList());
                        BigDecimal totalNet = payrolls.stream()
                                        .map(p -> p.getNetPay() != null ? p.getNetPay() : BigDecimal.ZERO)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);

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
        public ResponseEntity<com.accounting.app.dto.LedgerResponse> getLedgerEntries(
                        @PathVariable String accountId,
                        @RequestParam Integer month,
                        @RequestParam Integer year,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "20") int size) {

                List<Voucher> vouchers = voucherRepo.findByTargetMonthAndTargetYear(month, year);
                if (vouchers.isEmpty()) {
                        return ResponseEntity.ok(new com.accounting.app.dto.LedgerResponse(
                                        new com.accounting.app.dto.PageResponse<>(new ArrayList<>(), 0, size, 0, 0,
                                                        true),
                                        BigDecimal.ZERO, BigDecimal.ZERO));
                }

                org.springframework.data.domain.Page<JournalEntry> pageResult = journalRepo.findByVoucherInAndAccount(
                                vouchers, accountId, org.springframework.data.domain.PageRequest.of(page, size));

                List<Map<String, Object>> result = pageResult.getContent().stream()
                                .map(e -> {
                                        Map<String, Object> map = new LinkedHashMap<>();
                                        map.put("id", e.getId());
                                        map.put("voucherNumber", e.getVoucher().getVoucherNumber());
                                        map.put("voucherDate", e.getVoucher().getVoucherDate());
                                        map.put("description", e.getDescription());
                                        map.put("oppositeAccount",
                                                        e.getDebitAccount().getId().equals(accountId)
                                                                        ? e.getCreditAccount().getId()
                                                                        : e.getDebitAccount().getId());
                                        map.put("debit", e.getDebitAccount().getId().equals(accountId) ? e.getAmount()
                                                        : BigDecimal.ZERO);
                                        map.put("credit", e.getCreditAccount().getId().equals(accountId) ? e.getAmount()
                                                        : BigDecimal.ZERO);
                                        return map;
                                }).collect(Collectors.toList());

                com.accounting.app.dto.PageResponse<Map<String, Object>> pRes = new com.accounting.app.dto.PageResponse<>(
                                result,
                                pageResult.getNumber(),
                                pageResult.getSize(),
                                pageResult.getTotalElements(),
                                pageResult.getTotalPages(),
                                pageResult.isLast());

                // Tính tổng cho cả kỳ (không phân trang)
                List<JournalEntry> allEntries = journalRepo.findByVoucherInAndAccountList(vouchers, accountId);
                BigDecimal totalDebit = allEntries.stream()
                                .filter(e -> e.getDebitAccount().getId().equals(accountId))
                                .map(JournalEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalCredit = allEntries.stream()
                                .filter(e -> e.getCreditAccount().getId().equals(accountId))
                                .map(JournalEntry::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

                return ResponseEntity.ok(new com.accounting.app.dto.LedgerResponse(pRes, totalDebit, totalCredit));
        }

        /**
         * Báo cáo chi tiết Bảo hiểm (BHXH, BHYT, BHTN) theo kỳ
         */
        @GetMapping("/report/insurance")
        @PreAuthorize("@perm.check('ACCOUNTING_VIEW')")
        public ResponseEntity<Map<String, Object>> getInsuranceReport(
                        @RequestParam Integer month, @RequestParam Integer year) {
                List<Payroll> payrolls = payrollRepo.findByMonthAndYearSortedList(month, year).stream()
                                .filter(p -> p.getStatus() == PayrollStatus.APPROVED
                                                || p.getStatus() == PayrollStatus.PAID)
                                .collect(Collectors.toList());

                Map<String, Object> report = new LinkedHashMap<>();
                report.put("month", month);
                report.put("year", year);
                report.put("employeeCount", payrolls.size());

                // Tổng hợp phần NLĐ đóng
                report.put("totalBhxhEE",
                                payrolls.stream()
                                                .map(p -> p.getBhxhNhanVien() != null ? p.getBhxhNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalBhytEE",
                                payrolls.stream()
                                                .map(p -> p.getBhytNhanVien() != null ? p.getBhytNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalBhtnEE",
                                payrolls.stream()
                                                .map(p -> p.getBhtnNhanVien() != null ? p.getBhtnNhanVien()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalEE",
                                payrolls.stream()
                                                .map(p -> p.getTotalInsurance() != null ? p.getTotalInsurance()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));

                // Tổng hợp phần DN đóng
                report.put("totalBhxhER",
                                payrolls.stream().map(
                                                p -> p.getBhxhCongTy() != null ? p.getBhxhCongTy() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalBhytER",
                                payrolls.stream().map(
                                                p -> p.getBhytCongTy() != null ? p.getBhytCongTy() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalBhtnER",
                                payrolls.stream().map(
                                                p -> p.getBhtnCongTy() != null ? p.getBhtnCongTy() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalKpcd",
                                payrolls.stream().map(
                                                p -> p.getKpcdCongTy() != null ? p.getKpcdCongTy() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalER", payrolls.stream()
                                .map(p -> p.getTotalEmployerInsurance() != null ? p.getTotalEmployerInsurance()
                                                : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add));

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
                List<Payroll> payrolls = payrollRepo.findByMonthAndYearSortedList(month, year).stream()
                                .filter(p -> p.getStatus() == PayrollStatus.APPROVED
                                                || p.getStatus() == PayrollStatus.PAID)
                                .collect(Collectors.toList());

                Map<String, Object> report = new LinkedHashMap<>();
                report.put("month", month);
                report.put("year", year);
                report.put("employeeCount", payrolls.size());
                report.put("totalTaxableIncome",
                                payrolls.stream()
                                                .map(p -> p.getTaxableIncome() != null ? p.getTaxableIncome()
                                                                : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));
                report.put("totalTaxAmount",
                                payrolls.stream()
                                                .map(p -> p.getTaxAmount() != null ? p.getTaxAmount() : BigDecimal.ZERO)
                                                .reduce(BigDecimal.ZERO, BigDecimal::add));

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
                List<Payroll> payrolls = payrollRepo.findByMonthAndYearSortedList(month, year).stream()
                                .filter(p -> p.getStatus() == PayrollStatus.APPROVED
                                                || p.getStatus() == PayrollStatus.PAID)
                                .collect(Collectors.toList());

                BigDecimal totalContractSalary = payrolls.stream()
                                .map(p -> p.getContractSalary() != null ? p.getContractSalary() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalKpcd = payrolls.stream()
                                .map(p -> p.getKpcdCongTy() != null ? p.getKpcdCongTy() : BigDecimal.ZERO)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                Map<String, Object> report = new LinkedHashMap<>();
                report.put("month", month);
                report.put("year", year);
                report.put("employeeCount", payrolls.size());
                report.put("totalContractSalary", totalContractSalary);
                report.put("unionFeeRate", new BigDecimal("2.0"));
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
