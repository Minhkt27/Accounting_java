package com.accounting.app.service;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private AttendanceRepository attendanceRepository;
    @Autowired private PayrollRepository payrollRepository;
    @Autowired private SalaryParameterRepository salaryParameterRepository;
    @Autowired private TaxTierRepository taxTierRepository;
    @Autowired private AttendanceService attendanceService;
    @Autowired private SalaryChangeRepository salaryChangeRepository;
    
    @Autowired private VoucherRepository voucherRepo;
    @Autowired private JournalEntryRepository journalRepo;
    @Autowired private AccountCategoryRepository accountRepo;
    @Autowired private DeductionSettingRepository deductionRepo;
    @Autowired private EmployeeTaxConfigRepository taxConfigRepo;
    @Autowired private InsuranceConfigRepository insuranceConfigRepo;

    @Transactional
    public void approveMonthlyPayroll(Integer month, Integer year) {
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty()) throw new RuntimeException("Không tìm thấy bảng lương để phê duyệt");
        
        // Kiểm tra xem đã tính lương chưa (DRAFT)
        boolean allDraft = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!allDraft) throw new RuntimeException("Chỉ được phê duyệt bảng lương đang ở trạng thái DRAFT");

        Double totalGross = payrolls.stream().mapToDouble(Payroll::getGrossIncome).sum();
        Double totalInsuranceEE = payrolls.stream().mapToDouble(Payroll::getTotalInsurance).sum();
        Double totalInsuranceER = payrolls.stream().mapToDouble(Payroll::getTotalEmployerInsurance).sum();
        Double totalTax = payrolls.stream().mapToDouble(Payroll::getTaxAmount).sum();

        // Lấy tài khoản
        AccountCategory acc642 = accountRepo.findById("642").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 642"));
        AccountCategory acc334 = accountRepo.findById("334").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory acc338 = accountRepo.findById("338").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory acc3335 = accountRepo.findById("3335").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));

        // ═══════════════════════════════════════════════════════════
        // CHỨNG TỪ 1: GHI NHẬN CHI PHÍ LƯƠNG (Nợ 642 / Có 334)
        // ═══════════════════════════════════════════════════════════
        String voucherNo1 = String.format("PK-LUONG-%02d-%d", month, year % 100);
        Voucher v1 = new Voucher(voucherNo1, "PHIEU_KE_TOAN", LocalDate.now(), totalGross, "Trích chi phí tiền lương phải trả tháng " + month + "/" + year);
        v1.setTargetMonth(month);
        v1.setTargetYear(year);
        v1 = voucherRepo.save(v1);

        // Bút toán: Nợ 642 / Có 334 = Lương Gross
        journalRepo.save(new JournalEntry(v1, acc642, acc334, totalGross, "Chi phí lương tháng " + month));

        // ═══════════════════════════════════════════════════════════
        // CHỨNG TỪ 2: TRÍCH CÁC KHOẢN KHẤU TRỪ TỪ LƯƠNG NLĐ
        //   - Nợ 334 / Có 338  (BH phần NLĐ đóng 10.5%)
        //   - Nợ 334 / Có 3335 (Thuế TNCN)
        // ═══════════════════════════════════════════════════════════
        Double totalDeductions = totalInsuranceEE + totalTax;
        if (totalDeductions > 0) {
            String voucherNo2 = String.format("PK-KHAUTRU-%02d-%d", month, year % 100);
            Voucher v2 = new Voucher(voucherNo2, "PHIEU_KE_TOAN", LocalDate.now(), totalDeductions, "Trích các khoản khấu trừ lương NLĐ tháng " + month + "/" + year);
            v2.setTargetMonth(month);
            v2.setTargetYear(year);
            v2 = voucherRepo.save(v2);

            if (totalInsuranceEE > 0)
                journalRepo.save(new JournalEntry(v2, acc334, acc338, totalInsuranceEE, "Trích BHXH, BHYT, BHTN phần NLĐ (10.5%) tháng " + month));
            if (totalTax > 0)
                journalRepo.save(new JournalEntry(v2, acc334, acc3335, totalTax, "Trích thuế TNCN tháng " + month));
        }

        // ═══════════════════════════════════════════════════════════
        // CHỨNG TỪ 3: GHI NHẬN CHI PHÍ BH & KPCĐ PHẦN DN ĐÓNG
        //   - Nợ 642 / Có 338 (BH phần DN đóng 23.5%)
        // ═══════════════════════════════════════════════════════════
        if (totalInsuranceER > 0) {
            String voucherNo3 = String.format("PK-BHDN-%02d-%d", month, year % 100);
            Voucher v3 = new Voucher(voucherNo3, "PHIEU_KE_TOAN", LocalDate.now(), totalInsuranceER, "Trích chi phí BHXH, BHYT, BHTN, KPCĐ phần DN tháng " + month + "/" + year);
            v3.setTargetMonth(month);
            v3.setTargetYear(year);
            v3 = voucherRepo.save(v3);

            journalRepo.save(new JournalEntry(v3, acc642, acc338, totalInsuranceER, "Chi phí BH & KPCĐ phần DN (23.5%) tháng " + month));
        }

        // Cập nhật trạng thái -> APPROVED
        payrolls.forEach(p -> {
            p.setStatus(PayrollStatus.APPROVED);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        payrollRepository.saveAll(payrolls);
    }

    @Transactional
    public void rejectMonthlyPayroll(Integer month, Integer year, String reason) {
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty()) throw new RuntimeException("Không tìm thấy bảng lương để từ chối");

        // Chỉ từ chối khi đang ở trạng thái DRAFT
        boolean allDraft = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!allDraft) throw new RuntimeException("Chỉ được từ chối bảng lương đang ở trạng thái DRAFT");

        payrolls.forEach(p -> {
            p.setStatus(PayrollStatus.REJECTED);
            p.setRejectionReason(reason);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        payrollRepository.saveAll(payrolls);
    }

    @Transactional
    public void payMonthlyPayroll(Integer month, Integer year, String paymentMethod) {
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty()) throw new RuntimeException("Không tìm thấy bảng lương để thanh toán");
        
        boolean allApproved = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!allApproved) throw new RuntimeException("Chỉ được thanh toán sau khi bảng lương đã được Phê duyệt (APPROVED)");

        Double totalNet = payrolls.stream().mapToDouble(Payroll::getNetPay).sum();

        // Tạo Voucher Thanh toán lương (PC/UNC)
        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-LUONG-%02d-%d", prefix, month, year % 100);
        
        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalNet, "Thanh toán lương tháng " + month + "/" + year);
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Hạch toán: Nợ 334 / Có 111 hoặc 112
        AccountCategory acc334 = accountRepo.findById("334").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(new JournalEntry(v, acc334, accMethod, totalNet, "Thực chi tiền lương tháng " + month));

        // Cập nhật trạng thái -> PAID
        payrolls.forEach(p -> p.setStatus(PayrollStatus.PAID));
        payrollRepository.saveAll(payrolls);
    }

    @Transactional
    public void payInsurance(Integer month, Integer year, String paymentMethod) {
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty()) throw new RuntimeException("Không tìm thấy bảng lương");
        
        boolean valid = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!valid) throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        // Tổng BH Nhân viên + BH Công ty
        Double totalInsuranceEE = payrolls.stream().mapToDouble(Payroll::getTotalInsurance).sum();
        Double totalInsuranceER = payrolls.stream().mapToDouble(Payroll::getTotalEmployerInsurance).sum();
        Double totalInsurance = totalInsuranceEE + totalInsuranceER;

        if (totalInsurance <= 0) throw new RuntimeException("Không có khoản bảo hiểm cần thanh toán");

        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-BH-%02d-%d", prefix, month, year % 100);

        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalInsurance, "Nộp bảo hiểm tháng " + month + "/" + year + " (NLĐ + DN)");
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Hạch toán: Nợ 338 / Có 111 hoặc 112
        AccountCategory acc338 = accountRepo.findById("338").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(new JournalEntry(v, acc338, accMethod, totalInsurance, "Nộp BHXH, BHYT, BHTN, KPCĐ tháng " + month));
    }

    @Transactional
    public void payTax(Integer month, Integer year, String paymentMethod) {
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty()) throw new RuntimeException("Không tìm thấy bảng lương");

        boolean valid = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!valid) throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        Double totalTax = payrolls.stream().mapToDouble(Payroll::getTaxAmount).sum();

        if (totalTax <= 0) throw new RuntimeException("Không có khoản thuế TNCN cần nộp");

        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-THUE-%02d-%d", prefix, month, year % 100);

        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalTax, "Nộp thuế TNCN tháng " + month + "/" + year);
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Hạch toán: Nợ 3335 / Có 111 hoặc 112
        AccountCategory acc3335 = accountRepo.findById("3335").orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(new JournalEntry(v, acc3335, accMethod, totalTax, "Nộp thuế TNCN tháng " + month));
    }

    @Transactional
    public void calculateMonthlyPayroll(Integer month, Integer year) {
        LocalDate now = LocalDate.now();
        int currentMonthValue = now.getYear() * 12 + now.getMonthValue();
        int targetMonthValue = year * 12 + month;

        System.out.println("Payroll Check: Target=" + targetMonthValue + " vs Current=" + currentMonthValue);

        if (targetMonthValue > currentMonthValue) {
            throw new RuntimeException("Không thể tính lương cho tháng tương lai (Yêu cầu: " + month + "/" + year + ", Hiện tại: " + now.getMonthValue() + "/" + now.getYear() + ")");
        }

        // Kiểm tra xem đã chấm công cho tháng này chưa
        List<Attendance> attendances = attendanceRepository.findAllByMonthAndYearSortedList(month, year);
        if (attendances.isEmpty()) {
            throw new RuntimeException("Chưa hoàn tất chấm công cho tháng " + month + "/" + year + ". Vui lòng thực hiện chấm công và lưu lại trước khi tính lương.");
        }

        // 1. Thu thập dữ liệu đầu vào & Hằng số (Tối ưu hóa Bulk Fetching)
        System.out.println("Processing Payroll Calculation for: Month=" + month + ", Year=" + year);
        
        SalaryParameter params = salaryParameterRepository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .findFirst().orElse(defaultParams());
        
        List<Employee> employees = employeeRepository.findAllSortedList();
        
        // Fetch all data for this month in one go
        java.util.Map<String, Attendance> attendanceMap = attendanceRepository.findAllByMonthAndYearSortedList(month, year)
            .stream().collect(java.util.stream.Collectors.toMap(a -> a.getEmployee().getId(), a -> a, (a1, a2) -> a1));
            
        java.util.Map<String, Payroll> payrollMap = payrollRepository.findByMonthAndYearSortedList(month, year)
            .stream().collect(java.util.stream.Collectors.toMap(p -> p.getEmployee().getId(), p -> p, (p1, p2) -> p1));
            
        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        java.util.Map<String, List<SalaryChange>> changesMap = salaryChangeRepository.findAllApprovedInMonth(firstDay, lastDay)
            .stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getEmployee().getId()));

        java.util.Map<EmployeeType, EmployeeTaxConfig> taxConfigMap = taxConfigRepo.findAll()
            .stream().collect(java.util.stream.Collectors.toMap(c -> c.getEmployeeType(), c -> c, (c1, c2) -> c1));

        // Pre-fetch tax tiers
        List<TaxTier> approvedTaxTiers = taxTierRepository.findAll().stream()
            .filter(t -> "APPROVED".equals(t.getStatus()))
            .sorted(Comparator.comparing(TaxTier::getTierLevel))
            .collect(Collectors.toList());

        DeductionSetting approvedDeductions = deductionRepo.findAll().stream()
            .filter(d -> "APPROVED".equals(d.getStatus()))
            .findFirst().orElse(new DeductionSetting(null, 11000000.0, 4400000.0, "APPROVED"));

        InsuranceConfig approvedInsurance = insuranceConfigRepo.findAll().stream()
            .filter(c -> "APPROVED".equals(c.getStatus()))
            .findFirst().orElse(new InsuranceConfig());

        // Xác định số công chuẩn thực tế
        Double standardDays = params.getStandardWorkDays();
        if ("MONTHLY".equalsIgnoreCase(params.getStandardWorkDayMode())) {
            standardDays = (double) calculateBusinessDays(month, year);
        }
        
        java.util.List<Payroll> toSave = new java.util.ArrayList<>();

        for (Employee emp : employees) {
            if (!emp.getActive()) {
                if (emp.getResignationDate() != null) {
                    int resMonth = emp.getResignationDate().getMonthValue();
                    int resYear = emp.getResignationDate().getYear();
                    if (resYear < year || (resYear == year && resMonth < month)) continue;
                } else continue;
            }

            Attendance attendance = attendanceMap.get(emp.getId());
            Double realDays;
            Double paidLeaveDays;
            if (attendance != null) {
                realDays = attendance.getRealWorkDays() != null ? attendance.getRealWorkDays() : 0.0;
                paidLeaveDays = attendance.getPaidLeaveDays() != null ? attendance.getPaidLeaveDays() : 0.0;
            } else {
                com.accounting.app.dto.AttendanceSuggestion suggestion = attendanceService.getAttendanceSuggestion(emp.getId(), month, year, standardDays);
                realDays = suggestion.getPhysicalDays();
                paidLeaveDays = suggestion.getPaidLeaveDays();
                attendance = new Attendance(emp, month, year, realDays, paidLeaveDays, 0.0, 0.0, 0.0);
                attendance = attendanceRepository.save(attendance);
                attendanceMap.put(emp.getId(), attendance);
            }

            Payroll payroll = payrollMap.getOrDefault(emp.getId(), new Payroll());
            payroll.setEmployee(emp);
            payroll.setMonth(month);
            payroll.setYear(year);
            payroll.setContractSalary(emp.getContractSalary());
            payroll.setRealWorkDays(realDays);
            payroll.setPaidLeaveDays(paidLeaveDays);
            payroll.setStandardWorkDays(standardDays);

            // Tính lương thời gian
            Double totalPaidDays = realDays + (paidLeaveDays != null ? paidLeaveDays : 0.0);
            Double contractSal = emp.getContractSalary() != null ? emp.getContractSalary() : 0.0;
            Double baseSalary = (double) Math.round((contractSal / standardDays) * totalPaidDays);
            if (emp.getEmployeeType() == EmployeeType.PROBATION) baseSalary = (double) Math.round(baseSalary * 0.85);
            payroll.setBaseSalaryPay(baseSalary);

            // Phụ cấp
            Double mealAllowance = (double) Math.round((params.getMealAllowance() != null ? params.getMealAllowance() : 0.0) * realDays);
            payroll.setMealAllowance(mealAllowance);
            payroll.setPositionAllowance(0.0);
            payroll.setSeniorityAllowance(emp.getSeniorityAllowance() != null ? emp.getSeniorityAllowance() : 0.0);
            if (payroll.getOtherAllowances() == null) payroll.setOtherAllowances(0.0);
            
            // Salary Changes (Rewards/Disciplines)
            List<SalaryChange> changes = changesMap.getOrDefault(emp.getId(), List.of());
            payroll.setBonus(changes.stream().filter(c -> "REWARD".equals(c.getChangeType())).mapToDouble(c -> c.getNewValue() != null ? c.getNewValue() : 0.0).sum());
            payroll.setPenalty(changes.stream().filter(c -> "DISCIPLINE".equals(c.getChangeType())).mapToDouble(c -> c.getNewValue() != null ? c.getNewValue() : 0.0).sum());
            if (payroll.getCharityDeduction() == null) payroll.setCharityDeduction(0.0);

            // OT calculation
            Double hourlyRate = contractSal / (standardDays * 8);
            double otNormHours = attendance.getOtNormalHours() != null ? attendance.getOtNormalHours() : 0.0;
            double otWeekHours = attendance.getOtWeekendHours() != null ? attendance.getOtWeekendHours() : 0.0;
            double otHoliHours = attendance.getOtHolidayHours() != null ? attendance.getOtHolidayHours() : 0.0;

            Double otNormal = (double) Math.round(hourlyRate * 1.5 * otNormHours);
            Double otWeekend = (double) Math.round(hourlyRate * 2.0 * otWeekHours);
            Double otHoliday = (double) Math.round(hourlyRate * 3.0 * otHoliHours);
            
            payroll.setOtNormalPay(otNormal);
            payroll.setOtWeekendPay(otWeekend);
            payroll.setOtHolidayPay(otHoliday);
            payroll.setOtPay(otNormal + otWeekend + otHoliday);
            payroll.setOtNormalHours(otNormHours);
            payroll.setOtWeekendHours(otWeekHours);
            payroll.setOtHolidayHours(otHoliHours);
            payroll.setOtPremiumPay((double) Math.round(hourlyRate * (0.5 * otNormHours + 1.0 * otWeekHours + 2.0 * otHoliHours)));

            Double grossIncome = Math.max(0.0, baseSalary + mealAllowance + payroll.getSeniorityAllowance() + payroll.getOtherAllowances() + payroll.getBonus() + payroll.getOtPay() - payroll.getPenalty());
            payroll.setGrossIncome(grossIncome);

            // Bảo hiểm
            Double bhxhEE = 0.0, bhytEE = 0.0, bhtnEE = 0.0;
            Double bhxhER = 0.0, bhytER = 0.0, bhtnER = 0.0, kpcdER = 0.0;

            if (emp.getEmployeeType() == EmployeeType.FULL_TIME) {
                Double insuranceSalary = Math.min(contractSal, params.getInsuranceCeiling() != null ? params.getInsuranceCeiling() : 36000000.0);
                bhxhEE = (double) Math.round(insuranceSalary * (approvedInsurance.getBhxhEmployee() != null ? approvedInsurance.getBhxhEmployee() : 8.0) / 100.0);
                bhytEE = (double) Math.round(insuranceSalary * (approvedInsurance.getBhytEmployee() != null ? approvedInsurance.getBhytEmployee() : 1.5) / 100.0);
                bhtnEE = (double) Math.round(insuranceSalary * (approvedInsurance.getBhtnEmployee() != null ? approvedInsurance.getBhtnEmployee() : 1.0) / 100.0);
                bhxhER = (double) Math.round(insuranceSalary * (approvedInsurance.getBhxhEmployer() != null ? approvedInsurance.getBhxhEmployer() : 17.5) / 100.0);
                bhytER = (double) Math.round(insuranceSalary * (approvedInsurance.getBhytEmployer() != null ? approvedInsurance.getBhytEmployer() : 3.0) / 100.0);
                bhtnER = (double) Math.round(insuranceSalary * (approvedInsurance.getBhtnEmployer() != null ? approvedInsurance.getBhtnEmployer() : 1.0) / 100.0);
                kpcdER = (double) Math.round(insuranceSalary * (approvedInsurance.getKpcdEmployer() != null ? approvedInsurance.getKpcdEmployer() : 2.0) / 100.0);
            }
            
            payroll.setBhxhNhanVien(bhxhEE); payroll.setBhytNhanVien(bhytEE); payroll.setBhtnNhanVien(bhtnEE);
            payroll.setTotalInsurance(bhxhEE + bhytEE + bhtnEE);
            payroll.setBhxhCongTy(bhxhER); payroll.setBhytCongTy(bhytER); payroll.setBhtnCongTy(bhtnER); payroll.setKpcdCongTy(kpcdER);
            payroll.setTotalEmployerInsurance(bhxhER + bhytER + bhtnER + kpcdER);

            // Thuế TNCN
            Double otPremium = payroll.getOtPremiumPay() != null ? payroll.getOtPremiumPay() : 0.0;
            Double taxableIncomeBase = grossIncome - mealAllowance - otPremium;
            Double dSelf = approvedDeductions.getPersonalDeduction() != null ? approvedDeductions.getPersonalDeduction() : 11000000.0; 
            Double dDep = (emp.getDependentCount() != null ? emp.getDependentCount() : 0) * (approvedDeductions.getDependentDeduction() != null ? approvedDeductions.getDependentDeduction() : 4400000.0);
            Double taxableIncome = Math.max(0.0, taxableIncomeBase - dSelf - dDep - payroll.getTotalInsurance() - (payroll.getCharityDeduction() != null ? payroll.getCharityDeduction() : 0.0));
            
            payroll.setTaxableIncomeBase(taxableIncomeBase);
            payroll.setPersonalDeduction(dSelf);
            payroll.setDependentDeduction(dDep);
            payroll.setDependentCount(emp.getDependentCount() != null ? emp.getDependentCount() : 0);
            
            EmployeeTaxConfig taxConfig = taxConfigMap.getOrDefault(emp.getEmployeeType(), new EmployeeTaxConfig(null, emp.getEmployeeType(), TaxMethod.PROGRESSIVE, "APPROVED"));
            Double taxAmount = 0.0;
            if (taxConfig.getTaxMethod() == TaxMethod.PROGRESSIVE) taxAmount = calculatePITOptimized(taxableIncome, approvedTaxTiers);
            else if (taxConfig.getTaxMethod() == TaxMethod.FIXED_10 && grossIncome >= 2000000) taxAmount = (double) Math.round(grossIncome * 0.1);
            
            payroll.setTaxableIncome(taxableIncome);
            payroll.setTaxAmount(taxAmount);
            payroll.setNetPay(grossIncome - payroll.getTotalInsurance() - taxAmount);
            payroll.setStatus(PayrollStatus.DRAFT);
            toSave.add(payroll);
        }
        payrollRepository.saveAll(toSave);
        System.out.println("Payroll Calculation completed successfully for " + toSave.size() + " records.");
    }

    private Double calculatePITOptimized(Double income, List<TaxTier> tiers) {
        if (income <= 0) return 0.0;
        if (tiers.isEmpty()) {
            if (income <= 10000000) return (double) Math.round(income * 0.05);
            if (income <= 30000000) return (double) Math.round(income * 0.10 - 500000);
            if (income <= 60000000) return (double) Math.round(income * 0.20 - 3500000);
            if (income <= 100000000) return (double) Math.round(income * 0.30 - 9500000);
            return (double) Math.round(income * 0.35 - 14500000);
        }
        
        Double tax = 0.0;
        Double remainingIncome = income;
        for (TaxTier tier : tiers) {
            Double lBound = tier.getLowerBound() != null ? tier.getLowerBound() : 0.0;
            Double uBound = (tier.getUpperBound() == null || tier.getUpperBound() <= 0) ? 999999999.0 : tier.getUpperBound();
            Double tierSpan = uBound - lBound;
            if (remainingIncome > tierSpan && tierSpan > 0) {
                tax += tierSpan * (tier.getTaxRate() / 100.0);
                remainingIncome -= tierSpan;
            } else {
                tax += remainingIncome * (tier.getTaxRate() / 100.0);
                break;
            }
        }
        return (double) Math.round(tax);
    }

    private Double calculatePIT(Double income) {
        if (income <= 0) return 0.0;
        List<TaxTier> tiers = taxTierRepository.findAll().stream()
            .filter(t -> "APPROVED".equals(t.getStatus()))
            .collect(Collectors.toList());
        
        if (tiers.isEmpty()) {
            // Mặc định 5 bậc thuế luỹ tiến từng phần theo quy định pháp luật
            // Bậc 1: Đến 10 triệu/tháng -> 5%
            if (income <= 10000000) return (double) Math.round(income * 0.05);
            // Bậc 2: Trên 10 đến 30 triệu -> 10%
            if (income <= 30000000) return (double) Math.round(income * 0.10 - 500000);
            // Bậc 3: Trên 30 đến 60 triệu -> 20%
            if (income <= 60000000) return (double) Math.round(income * 0.20 - 3500000);
            // Bậc 4: Trên 60 đến 100 triệu -> 30%
            if (income <= 100000000) return (double) Math.round(income * 0.30 - 9500000);
            // Bậc 5: Trên 100 triệu -> 35%
            return (double) Math.round(income * 0.35 - 14500000);
        }
        
        tiers.sort(Comparator.comparing(TaxTier::getTierLevel));
        Double tax = 0.0;
        Double remainingIncome = income;
        
        for (TaxTier tier : tiers) {
            Double lBound = tier.getLowerBound() != null ? tier.getLowerBound() : 0.0;
            Double uBound = (tier.getUpperBound() == null || tier.getUpperBound() <= 0) ? 999999999.0 : tier.getUpperBound();
            Double tierSpan = uBound - lBound;
            
            if (remainingIncome > tierSpan && tierSpan > 0) {
                tax += tierSpan * (tier.getTaxRate() / 100.0);
                remainingIncome -= tierSpan;
            } else {
                tax += remainingIncome * (tier.getTaxRate() / 100.0);
                break;
            }
        }
        return (double) Math.round(tax);
    }

    private int calculateBusinessDays(int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        int daysInMonth = start.lengthOfMonth();
        int businessDays = 0;
        for (int i = 1; i <= daysInMonth; i++) {
            LocalDate date = LocalDate.of(year, month, i);
            if (date.getDayOfWeek().getValue() < 6) { // T2 -> T6
                businessDays++;
            }
        }
        return businessDays;
    }

    private SalaryParameter defaultParams() {
        SalaryParameter p = new SalaryParameter();
        p.setStandardWorkDays(26.0);
        p.setStandardWorkDayMode("FIXED");
        p.setMinimumWage(1800000.0);
        p.setMealAllowance(25000.0);
        return p;
    }
}
