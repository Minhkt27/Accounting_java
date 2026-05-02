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

        // 1. Thu thập dữ liệu đầu vào & Hằng số
        System.out.println("Processing Payroll Calculation for: Month=" + month + ", Year=" + year);
        
        SalaryParameter params = salaryParameterRepository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .findFirst().orElse(defaultParams());
        System.out.println("Using Salary Parameters: " + params.getStatus());
        
        List<Employee> employees = employeeRepository.findAllSortedList();
        System.out.println("Found " + employees.size() + " total employees in database.");
        
        // Xác định số công chuẩn thực tế (Dựa trên cấu hình: FIXED hoặc MONTHLY)
        Double standardDays = params.getStandardWorkDays();
        if ("MONTHLY".equalsIgnoreCase(params.getStandardWorkDayMode())) {
            standardDays = (double) calculateBusinessDays(month, year);
        }
        
        for (Employee emp : employees) {
            if (!emp.getActive()) {
                // Kiểm tra xem có phải mới nghỉ trong tháng này không
                if (emp.getResignationDate() != null) {
                    int resMonth = emp.getResignationDate().getMonthValue();
                    int resYear = emp.getResignationDate().getYear();
                    if (resYear < year || (resYear == year && resMonth < month)) {
                        continue; // Đã nghỉ từ các tháng trước -> Bỏ qua
                    }
                    // Nếu nghỉ trong tháng này -> Vẫn cho tính lương (để trả nốt ngày công)
                } else {
                    continue; 
                }
            }

            // Ưu tiên lấy dữ liệu chấm công đã có trong DB (do kế toán đã xác nhận hoặc sửa tay)
            Optional<Attendance> optAttendance = attendanceRepository.findByEmployeeIdAndMonthAndYear(emp.getId(), month, year);
            
            Attendance attendance;
            Double realDays;
            Double paidLeaveDays;
            if (optAttendance.isPresent()) {
                attendance = optAttendance.get();
                realDays = attendance.getRealWorkDays() != null ? attendance.getRealWorkDays() : 0.0;
                paidLeaveDays = attendance.getPaidLeaveDays() != null ? attendance.getPaidLeaveDays() : 0.0;
            } else {
                // Nếu chưa có bản ghi chấm công, hệ thống mới tự tính gợi ý từ biến động nghỉ phép
                com.accounting.app.dto.AttendanceSuggestion suggestion = attendanceService.getAttendanceSuggestion(emp.getId(), month, year, standardDays);
                realDays = suggestion.getPhysicalDays();
                paidLeaveDays = suggestion.getPaidLeaveDays();
                attendance = new Attendance(emp, month, year, realDays, paidLeaveDays, 0.0, 0.0, 0.0);
                attendanceRepository.save(attendance);
            }

            Payroll payroll = payrollRepository.findByEmployeeIdAndMonthAndYear(emp.getId(), month, year)
                    .orElse(new Payroll());

            payroll.setEmployee(emp);
            payroll.setMonth(month);
            payroll.setYear(year);
            payroll.setContractSalary(emp.getContractSalary());
            payroll.setRealWorkDays(realDays);
            payroll.setPaidLeaveDays(paidLeaveDays);
            payroll.setStandardWorkDays(standardDays);

            // Bước 2: Tính lương theo thời gian
            Double totalPaidDays = realDays + (paidLeaveDays != null ? paidLeaveDays : 0.0);
            Double contractSal = emp.getContractSalary() != null ? emp.getContractSalary() : 0.0;
            Double baseSalary = (contractSal / standardDays) * totalPaidDays;
            
            if (emp.getEmployeeType() == EmployeeType.PROBATION) {
                baseSalary = baseSalary * 0.85;
            }
            baseSalary = (double) Math.round(baseSalary);
            payroll.setBaseSalaryPay(baseSalary);

            // Bước 3: Tính phụ cấp
            Double mealAllowance = (double) Math.round((params.getMealAllowance() != null ? params.getMealAllowance() : 0.0) * realDays);
            Double positionAllowance = 0.0;
            Double seniorityAllowance = emp.getSeniorityAllowance() != null ? emp.getSeniorityAllowance() : 0.0;
            
            payroll.setMealAllowance(mealAllowance);
            payroll.setPositionAllowance(positionAllowance);
            payroll.setSeniorityAllowance(seniorityAllowance);
            // Giữ nguyên Bonus, Penalty, OtherAllowances nếu đã được nhập từ trước
            if (payroll.getOtherAllowances() == null) payroll.setOtherAllowances(0.0);
            
            // Tự động lấy khen thưởng/kỷ luật từ biến động lương (SalaryChange)
            LocalDate firstDay = LocalDate.of(year, month, 1);
            LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
            List<SalaryChange> changes = salaryChangeRepository.findApprovedInMonth(emp.getId(), firstDay, lastDay);
            
            Double totalReward = changes.stream()
                .filter(c -> "REWARD".equals(c.getChangeType()))
                .mapToDouble(c -> c.getNewValue() != null ? c.getNewValue() : 0.0)
                .sum();
            Double totalDiscipline = changes.stream()
                .filter(c -> "DISCIPLINE".equals(c.getChangeType()))
                .mapToDouble(c -> c.getNewValue() != null ? c.getNewValue() : 0.0)
                .sum();

            payroll.setBonus(totalReward);
            payroll.setPenalty(totalDiscipline);
            
            if (payroll.getCharityDeduction() == null) payroll.setCharityDeduction(0.0);


            // Bước 4: Tính OT (3 loại hệ số: 1.5, 2.0, 3.0)
            Double hourlyRate = (emp.getContractSalary() != null ? emp.getContractSalary() : 0.0) / (standardDays * 8);
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

            // Phần OT miễn thuế (chênh lệch hệ số)
            Double otPremiumExempt = (double) Math.round(hourlyRate * (
                0.5 * otNormHours + 
                1.0 * otWeekHours + 
                2.0 * otHoliHours
            ));
            payroll.setOtPremiumPay(otPremiumExempt);

            // Tổng thu nhập
            Double grossIncome = baseSalary + mealAllowance + positionAllowance + seniorityAllowance + 
                                payroll.getOtherAllowances() + payroll.getBonus() + payroll.getOtPay() - payroll.getPenalty();
            if (grossIncome < 0) grossIncome = 0.0;
            payroll.setGrossIncome(grossIncome);


            // Bước 5: Tính bảo hiểm dựa trên cấu hình InsuranceConfig (chỉ lấy APPROVED)
            InsuranceConfig config = insuranceConfigRepo.findAll().stream()
                .filter(c -> "APPROVED".equals(c.getStatus()))
                .findFirst().orElse(new InsuranceConfig());
            
            Double rateXH_EE = (config.getBhxhEmployee() != null ? config.getBhxhEmployee() : 8.0) / 100.0;
            Double rateYT_EE = (config.getBhytEmployee() != null ? config.getBhytEmployee() : 1.5) / 100.0;
            Double rateTN_EE = (config.getBhtnEmployee() != null ? config.getBhtnEmployee() : 1.0) / 100.0;

            Double rateXH_ER = (config.getBhxhEmployer() != null ? config.getBhxhEmployer() : 17.5) / 100.0;
            Double rateYT_ER = (config.getBhytEmployer() != null ? config.getBhytEmployer() : 3.0) / 100.0;
            Double rateTN_ER = (config.getBhtnEmployer() != null ? config.getBhtnEmployer() : 1.0) / 100.0;
            Double rateKP_ER = (config.getKpcdEmployer() != null ? config.getKpcdEmployer() : 2.0) / 100.0;

            Double bhxhEE = 0.0, bhytEE = 0.0, bhtnEE = 0.0;
            Double bhxhER = 0.0, bhytER = 0.0, bhtnER = 0.0, kpcdER = 0.0;

            if (emp.getEmployeeType() == EmployeeType.FULL_TIME) {
                Double cSal = emp.getContractSalary() != null ? emp.getContractSalary() : 0.0;
                // Áp dụng mức trần bảo hiểm (thường là 20 lần lương cơ sở)
                Double insuranceSalary = Math.min(cSal, params.getInsuranceCeiling() != null ? params.getInsuranceCeiling() : 36000000.0);
                
                bhxhEE = (double) Math.round(insuranceSalary * rateXH_EE);
                bhytEE = (double) Math.round(insuranceSalary * rateYT_EE);
                bhtnEE = (double) Math.round(insuranceSalary * rateTN_EE);

                bhxhER = (double) Math.round(insuranceSalary * rateXH_ER);
                bhytER = (double) Math.round(insuranceSalary * rateYT_ER);
                bhtnER = (double) Math.round(insuranceSalary * rateTN_ER);
                kpcdER = (double) Math.round(insuranceSalary * rateKP_ER);
            }
            
            payroll.setBhxhNhanVien(bhxhEE);
            payroll.setBhytNhanVien(bhytEE);
            payroll.setBhtnNhanVien(bhtnEE);
            payroll.setTotalInsurance(bhxhEE + bhytEE + bhtnEE);

            payroll.setBhxhCongTy(bhxhER);
            payroll.setBhytCongTy(bhytER);
            payroll.setBhtnCongTy(bhtnER);
            payroll.setKpcdCongTy(kpcdER);
            payroll.setTotalEmployerInsurance(bhxhER + bhytER + bhtnER + kpcdER);

            // Bước 6: Tính thuế TNCN (Lấy cấu hình giảm trừ APPROVED)
            DeductionSetting deductions = deductionRepo.findAll().stream()
                .filter(d -> "APPROVED".equals(d.getStatus()))
                .findFirst().orElse(new DeductionSetting(null, 11000000.0, 4400000.0, "APPROVED")); 
            
            Double otPremium = payroll.getOtPremiumPay() != null ? payroll.getOtPremiumPay() : 0.0;
            Double taxableIncomeBase = grossIncome - mealAllowance - otPremium;
            Double dSelf = deductions.getPersonalDeduction() != null ? deductions.getPersonalDeduction() : 0.0; 
            Double dDep = (emp.getDependentCount() != null ? emp.getDependentCount() : 0) * (deductions.getDependentDeduction() != null ? deductions.getDependentDeduction() : 0.0);
            
            Double totalInsEE = payroll.getTotalInsurance() != null ? payroll.getTotalInsurance() : 0.0;
            Double charity = payroll.getCharityDeduction() != null ? payroll.getCharityDeduction() : 0.0;
            Double taxableIncome = taxableIncomeBase - dSelf - dDep - totalInsEE - charity;
            if (taxableIncome < 0) taxableIncome = 0.0;

            payroll.setTaxableIncomeBase(taxableIncomeBase);
            payroll.setPersonalDeduction(dSelf);
            payroll.setDependentDeduction(dDep);
            payroll.setDependentCount(emp.getDependentCount() != null ? emp.getDependentCount() : 0);
            
            Double taxAmount = 0.0;
            EmployeeTaxConfig taxConfig = taxConfigRepo.findByEmployeeType(emp.getEmployeeType())
                .orElse(new EmployeeTaxConfig(null, emp.getEmployeeType(), TaxMethod.PROGRESSIVE, "APPROVED"));
            
            if (taxConfig.getTaxMethod() == TaxMethod.PROGRESSIVE) {
                taxAmount = calculatePIT(taxableIncome);
            } else if (taxConfig.getTaxMethod() == TaxMethod.FIXED_10) {
                if (grossIncome >= 2000000) {
                    taxAmount = (double) Math.round(grossIncome * 0.1);
                }
            } else {
                taxAmount = 0.0; // EXEMPT
            }
            
            payroll.setTaxableIncome(taxableIncome);
            payroll.setTaxAmount(taxAmount);

            // Bước 7: Tính lương thực lĩnh
            Double tIns = payroll.getTotalInsurance() != null ? payroll.getTotalInsurance() : 0.0;
            Double tAmount = taxAmount != null ? taxAmount : 0.0;
            Double netPay = grossIncome - tIns - tAmount;
            payroll.setNetPay(netPay);
            payroll.setStatus(PayrollStatus.DRAFT);

                payrollRepository.save(payroll);
        }
        System.out.println("Payroll Calculation completed successfully.");
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
