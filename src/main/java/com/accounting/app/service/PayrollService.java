package com.accounting.app.service;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayrollService {

    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private PayrollRepository payrollRepository;
    @Autowired
    private SalaryParameterRepository salaryParameterRepository;
    @Autowired
    private TaxTierRepository taxTierRepository;
    @Autowired
    private AttendanceService attendanceService;
    @Autowired
    private SalaryChangeRepository salaryChangeRepository;

    @Autowired
    private VoucherRepository voucherRepo;
    @Autowired
    private JournalEntryRepository journalRepo;
    @Autowired
    private AccountCategoryRepository accountRepo;
    @Autowired
    private DeductionSettingRepository deductionRepo;
    @Autowired
    private EmployeeTaxConfigRepository taxConfigRepo;
    @Autowired
    private InsuranceConfigRepository insuranceConfigRepo;

    // Phê duyệt bảng lương tháng và năm, thực hiện trích các khoản lương, bảo hiểm,
    // thuế liên quan
    @Transactional
    public void approveMonthlyPayroll(Integer month, Integer year) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra tính hợp lệ
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để phê duyệt");

        // Bước 2: Đảm bảo bảng lương đang ở trạng thái DRAFT
        boolean allDraft = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!allDraft)
            throw new RuntimeException("Chỉ được phê duyệt bảng lương đang ở trạng thái DRAFT");

        // Bước 3: Tính toán tổng tiền lương Gross, bảo hiểm và thuế TNCN của cả công ty
        BigDecimal totalGross = payrolls.stream().map(Payroll::getGrossIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalInsuranceEE = payrolls.stream().map(Payroll::getTotalInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal totalInsuranceER = payrolls.stream().map(Payroll::getTotalEmployerInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal totalTax = payrolls.stream().map(Payroll::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bước 4: Lấy các tài khoản kế toán tương ứng từ danh mục tài khoản
        AccountCategory acc642 = accountRepo.findById("642")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 642"));
        AccountCategory acc334 = accountRepo.findById("334")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory acc338 = accountRepo.findById("338")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory acc3335 = accountRepo.findById("3335")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));

        // Bước 5: Ghi nhận chứng từ chi phí lương (Nợ 642 / Có 334)
        String voucherNo1 = String.format("PK-LUONG-%02d-%d", month, year % 100);
        Voucher v1 = new Voucher(voucherNo1, "PHIEU_KE_TOAN", LocalDate.now(), totalGross,
                "Trích chi phí tiền lương phải trả tháng " + month + "/" + year);
        v1.setTargetMonth(month);
        v1.setTargetYear(year);
        v1 = voucherRepo.save(v1);

        journalRepo.save(new JournalEntry(v1, acc642, acc334, totalGross, "Chi phí lương tháng " + month));

        // Bước 6: Ghi nhận chứng từ trích các khoản khấu trừ lương của người lao động
        // (BHXH, Thuế TNCN)
        BigDecimal totalDeductions = totalInsuranceEE.add(totalTax);
        if (totalDeductions.compareTo(BigDecimal.ZERO) > 0) {
            String voucherNo2 = String.format("PK-KHAUTRU-%02d-%d", month, year % 100);
            Voucher v2 = new Voucher(voucherNo2, "PHIEU_KE_TOAN", LocalDate.now(), totalDeductions,
                    "Trích các khoản khấu trừ lương NLĐ tháng " + month + "/" + year);
            v2.setTargetMonth(month);
            v2.setTargetYear(year);
            v2 = voucherRepo.save(v2);

            if (totalInsuranceEE.compareTo(BigDecimal.ZERO) > 0)
                journalRepo.save(new JournalEntry(v2, acc334, acc338, totalInsuranceEE,
                        "Trích BHXH, BHYT, BHTN phần NLĐ (10.5%) tháng " + month));
            if (totalTax.compareTo(BigDecimal.ZERO) > 0)
                journalRepo.save(new JournalEntry(v2, acc334, acc3335, totalTax, "Trích thuế TNCN tháng " + month));
        }

        // Bước 7: Ghi nhận chứng từ chi phí bảo hiểm và kinh phí công đoàn phần doanh
        // nghiệp đóng (Nợ 642 / Có 338)
        if (totalInsuranceER.compareTo(BigDecimal.ZERO) > 0) {
            String voucherNo3 = String.format("PK-BHDN-%02d-%d", month, year % 100);
            Voucher v3 = new Voucher(voucherNo3, "PHIEU_KE_TOAN", LocalDate.now(), totalInsuranceER,
                    "Trích chi phí BHXH, BHYT, BHTN, KPCĐ phần DN tháng " + month + "/" + year);
            v3.setTargetMonth(month);
            v3.setTargetYear(year);
            v3 = voucherRepo.save(v3);

            journalRepo.save(new JournalEntry(v3, acc642, acc338, totalInsuranceER,
                    "Chi phí BH & KPCĐ phần DN (23.5%) tháng " + month));
        }

        // Bước 8: Cập nhật trạng thái bảng lương thành APPROVED và lưu thông tin người
        // phê duyệt
        payrolls.forEach(p -> {
            p.setStatus(PayrollStatus.APPROVED);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        payrollRepository.saveAll(payrolls);
    }

    // Từ chối phê duyệt bảng lương tháng và năm với lý do cụ thể
    @Transactional
    public void rejectMonthlyPayroll(Integer month, Integer year, String reason) {
        // Bước 1: Lấy danh sách bảng lương tháng cần từ chối
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để từ chối");

        // Bước 2: Kiểm tra đảm bảo bảng lương đang ở trạng thái nháp DRAFT
        boolean allDraft = payrolls.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!allDraft)
            throw new RuntimeException("Chỉ được từ chối bảng lương đang ở trạng thái DRAFT");

        // Bước 3: Cập nhật trạng thái bảng lương sang REJECTED cùng lý do và lưu lại
        payrolls.forEach(p -> {
            p.setStatus(PayrollStatus.REJECTED);
            p.setRejectionReason(reason);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        payrollRepository.saveAll(payrolls);
    }

    // Thực hiện thanh toán lương cho nhân viên và hạch toán chứng từ kế toán
    @Transactional
    public void payMonthlyPayroll(Integer month, Integer year, String paymentMethod) {
        // Bước 1: Lấy danh sách bảng lương tháng cần thanh toán
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để thanh toán");

        // Bước 2: Đảm bảo bảng lương đã được phê duyệt (APPROVED) hoặc đã thanh toán
        boolean allApproved = payrolls.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!allApproved)
            throw new RuntimeException("Chỉ được thanh toán sau khi bảng lương đã được Phê duyệt (APPROVED)");

        // Bước 3: Tính tổng số tiền lương Net cần thanh toán thực tế
        BigDecimal totalNet = payrolls.stream().map(Payroll::getNetPay).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bước 4: Tạo chứng từ chi tiền mặt (PHIEU_CHI) hoặc ủy nhiệm chi (UNC)
        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-LUONG-%02d-%d", prefix, month, year % 100);

        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalNet,
                "Thanh toán lương tháng " + month + "/" + year);
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Bước 5: Hạch toán kế toán thực chi lương (Nợ 334 / Có 111 hoặc 112)
        AccountCategory acc334 = accountRepo.findById("334")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(new JournalEntry(v, acc334, accMethod, totalNet, "Thực chi tiền lương tháng " + month));

        // Bước 6: Cập nhật trạng thái bảng lương của từng nhân viên thành PAID và lưu
        // lại
        payrolls.forEach(p -> p.setStatus(PayrollStatus.PAID));
        payrollRepository.saveAll(payrolls);
    }

    // Nộp các khoản bảo hiểm bắt buộc tháng và hạch toán chứng từ kế toán tương ứng
    @Transactional
    public void payInsurance(Integer month, Integer year, String paymentMethod) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra hợp lệ
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương");

        // Bước 2: Đảm bảo bảng lương đã được duyệt hoặc thanh toán lương
        boolean valid = payrolls.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!valid)
            throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        // Bước 3: Tính tổng số tiền bảo hiểm phải nộp (của cả nhân viên đóng và công ty
        // đóng)
        BigDecimal totalInsuranceEE = payrolls.stream().map(Payroll::getTotalInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal totalInsuranceER = payrolls.stream().map(Payroll::getTotalEmployerInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal totalInsurance = totalInsuranceEE.add(totalInsuranceER);

        if (totalInsurance.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Không có khoản bảo hiểm cần thanh toán");

        // Bước 4: Tạo chứng từ chi nộp bảo hiểm (PHIEU_CHI hoặc UNC)
        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-BH-%02d-%d", prefix, month, year % 100);

        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalInsurance,
                "Nộp bảo hiểm tháng " + month + "/" + year + " (NLĐ + DN)");
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Bước 5: Hạch toán nộp tiền bảo hiểm lên cơ quan bảo hiểm (Nợ 338 / Có 111
        // hoặc 112)
        AccountCategory acc338 = accountRepo.findById("338")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(
                new JournalEntry(v, acc338, accMethod, totalInsurance, "Nộp BHXH, BHYT, BHTN, KPCĐ tháng " + month));
    }

    // Nộp thuế TNCN tháng của nhân viên và hạch toán chứng từ kế toán tương ứng
    @Transactional
    public void payTax(Integer month, Integer year, String paymentMethod) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra hợp lệ
        List<Payroll> payrolls = payrollRepository.findByMonthAndYearSortedList(month, year);
        if (payrolls.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương");

        // Bước 2: Đảm bảo bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán
        // lương
        boolean valid = payrolls.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!valid)
            throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        // Bước 3: Tính tổng số tiền thuế TNCN phải nộp
        BigDecimal totalTax = payrolls.stream().map(Payroll::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalTax.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Không có khoản thuế TNCN cần nộp");

        // Bước 4: Tạo chứng từ chi nộp thuế TNCN (PHIEU_CHI hoặc UNC)
        String prefix = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PC" : "UNC";
        String type = "PAYMENT".equalsIgnoreCase(paymentMethod) ? "PHIEU_CHI" : "UNC";
        String voucherNo = String.format("%s-THUE-%02d-%d", prefix, month, year % 100);

        Voucher v = new Voucher(voucherNo, type, LocalDate.now(), totalTax,
                "Nộp thuế TNCN tháng " + month + "/" + year);
        v.setTargetMonth(month);
        v.setTargetYear(year);
        v = voucherRepo.save(v);

        // Bước 5: Hạch toán nộp tiền thuế TNCN vào Ngân sách Nhà nước (Nợ 3335 / Có 111
        // hoặc 112)
        AccountCategory acc3335 = accountRepo.findById("3335")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));
        AccountCategory accMethod = accountRepo.findById("PAYMENT".equalsIgnoreCase(paymentMethod) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        journalRepo.save(new JournalEntry(v, acc3335, accMethod, totalTax, "Nộp thuế TNCN tháng " + month));
    }

    // Tính toán chi tiết bảng lương tháng cho toàn bộ nhân viên
    @Transactional
    public void calculateMonthlyPayroll(Integer month, Integer year) {
        // Bước 1: Kiểm tra tính hợp lệ của thời gian tính lương
        LocalDate now = LocalDate.now();
        int currentMonthValue = now.getYear() * 12 + now.getMonthValue();
        int targetMonthValue = year * 12 + month;

        System.out.println("Payroll Check: Target=" + targetMonthValue + " vs Current=" + currentMonthValue);

        if (targetMonthValue > currentMonthValue) {
            throw new RuntimeException("Không thể tính lương cho tháng tương lai (Yêu cầu: " + month + "/" + year
                    + ", Hiện tại: " + now.getMonthValue() + "/" + now.getYear() + ")");
        }

        // Bước 2: Kiểm tra dữ liệu chấm công của tháng
        List<Attendance> attendances = attendanceRepository.findAllByMonthAndYearSortedList(month, year);
        if (attendances.isEmpty()) {
            throw new RuntimeException("Chưa hoàn tất chấm công cho tháng " + month + "/" + year
                    + ". Vui lòng thực hiện chấm công và lưu lại trước khi tính lương.");
        }

        // Bước 3: Thu thập cấu hình hệ thống và dữ liệu đầu vào (Bulk Fetching)
        System.out.println("Processing Payroll Calculation for: Month=" + month + ", Year=" + year);

        SalaryParameter params = salaryParameterRepository.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .findFirst().orElse(defaultParams());

        List<Employee> employees = employeeRepository.findAllSortedList();

        // Fetch all data for this month in one go
        java.util.Map<String, Attendance> attendanceMap = attendanceRepository
                .findAllByMonthAndYearSortedList(month, year)
                .stream()
                .collect(java.util.stream.Collectors.toMap(a -> a.getEmployee().getId(), a -> a, (a1, a2) -> a1));

        java.util.Map<String, Payroll> payrollMap = payrollRepository.findByMonthAndYearSortedList(month, year)
                .stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getEmployee().getId(), p -> p, (p1, p2) -> p1));

        LocalDate firstDay = LocalDate.of(year, month, 1);
        LocalDate lastDay = firstDay.withDayOfMonth(firstDay.lengthOfMonth());
        java.util.Map<String, List<SalaryChange>> changesMap = salaryChangeRepository
                .findAllApprovedInMonth(firstDay, lastDay)
                .stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getEmployee().getId()));

        java.util.Map<String, List<SalaryChange>> salaryAdjustmentsMap = salaryChangeRepository
                .findAllApprovedSalaryAdjustments()
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
                .findFirst()
                .orElse(new DeductionSetting(null, new BigDecimal("11000000"), new BigDecimal("4400000"), "APPROVED"));

        InsuranceConfig approvedInsurance = insuranceConfigRepo.findAll().stream()
                .filter(c -> "APPROVED".equals(c.getStatus()))
                .findFirst().orElse(new InsuranceConfig());

        // Bước 4: Xác định số ngày công chuẩn trong tháng
        BigDecimal standardDays = params.getStandardWorkDays();
        if ("MONTHLY".equalsIgnoreCase(params.getStandardWorkDayMode())) {
            standardDays = new BigDecimal(calculateBusinessDays(month, year));
        }

        java.util.List<Payroll> toSave = new java.util.ArrayList<>();

        // Bước 5: Duyệt danh sách nhân viên để tính toán lương chi tiết
        for (Employee emp : employees) {
            if (!emp.getActive()) {
                if (emp.getResignationDate() != null) {
                    int resMonth = emp.getResignationDate().getMonthValue();
                    int resYear = emp.getResignationDate().getYear();
                    if (resYear < year || (resYear == year && resMonth < month))
                        continue;
                } else
                    continue;
            }

            // Bước 5.1: Lấy thông tin ngày công thực tế và ngày nghỉ phép hưởng lương
            Attendance attendance = attendanceMap.get(emp.getId());
            BigDecimal realDays;
            BigDecimal paidLeaveDays;
            if (attendance != null) {
                realDays = attendance.getRealWorkDays() != null ? attendance.getRealWorkDays() : BigDecimal.ZERO;
                paidLeaveDays = attendance.getPaidLeaveDays() != null ? attendance.getPaidLeaveDays() : BigDecimal.ZERO;
            } else {
                com.accounting.app.dto.AttendanceSuggestion suggestion = attendanceService
                        .getAttendanceSuggestion(emp.getId(), month, year, standardDays);
                realDays = suggestion.getPhysicalDays();
                paidLeaveDays = suggestion.getPaidLeaveDays();
                attendance = new Attendance(emp, month, year, realDays, paidLeaveDays, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO);
                attendance = attendanceRepository.save(attendance);
                attendanceMap.put(emp.getId(), attendance);
            }

            Payroll payroll = payrollMap.getOrDefault(emp.getId(), new Payroll());
            payroll.setEmployee(emp);
            payroll.setMonth(month);
            payroll.setYear(year);

            List<SalaryChange> adjustments = salaryAdjustmentsMap.getOrDefault(emp.getId(), List.of());
            BigDecimal contractSal = getContractSalaryAt(emp, lastDay, adjustments);

            payroll.setContractSalary(contractSal);
            payroll.setRealWorkDays(realDays);
            payroll.setPaidLeaveDays(paidLeaveDays);
            payroll.setStandardWorkDays(standardDays);

            // Bước 5.2: Tính lương thời gian (Lương cơ bản thực tế)
            BigDecimal totalPaidDays = realDays.add(paidLeaveDays != null ? paidLeaveDays : BigDecimal.ZERO);

            // Lương chính = (Lương HĐ / Standard) * totalPaidDays
            BigDecimal baseSalary = BigDecimal.ZERO;
            if (standardDays.compareTo(BigDecimal.ZERO) > 0) {
                baseSalary = contractSal.divide(standardDays, 10, RoundingMode.HALF_UP).multiply(totalPaidDays)
                        .setScale(0, RoundingMode.HALF_UP);
            }

            if (emp.getEmployeeType() == EmployeeType.PROBATION) {
                baseSalary = baseSalary.multiply(new BigDecimal("0.85")).setScale(0, RoundingMode.HALF_UP);
            }
            payroll.setBaseSalaryPay(baseSalary);

            // Bước 5.3: Tính các phụ cấp (phụ cấp ăn trưa, thâm niên) và tiền thưởng/phạt
            BigDecimal mealAllowance = (params.getMealAllowance() != null ? params.getMealAllowance() : BigDecimal.ZERO)
                    .multiply(realDays).setScale(0, RoundingMode.HALF_UP);
            payroll.setMealAllowance(mealAllowance);
            payroll.setPositionAllowance(BigDecimal.ZERO);
            payroll.setSeniorityAllowance(
                    emp.getSeniorityAllowance() != null ? emp.getSeniorityAllowance() : BigDecimal.ZERO);
            if (payroll.getOtherAllowances() == null)
                payroll.setOtherAllowances(BigDecimal.ZERO);

            // Salary Changes (Rewards/Disciplines)
            List<SalaryChange> changes = changesMap.getOrDefault(emp.getId(), List.of());
            payroll.setBonus(changes.stream().filter(c -> "REWARD".equals(c.getChangeType()))
                    .map(c -> c.getNewValue() != null ? c.getNewValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            payroll.setPenalty(changes.stream().filter(c -> "DISCIPLINE".equals(c.getChangeType()))
                    .map(c -> c.getNewValue() != null ? c.getNewValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            if (payroll.getCharityDeduction() == null)
                payroll.setCharityDeduction(BigDecimal.ZERO);

            // Bước 5.4: Tính lương làm thêm giờ (OT) và phần chênh lệch OT miễn thuế
            BigDecimal hourlyRate = BigDecimal.ZERO;
            if (standardDays.compareTo(BigDecimal.ZERO) > 0) {
                hourlyRate = contractSal.divide(standardDays.multiply(new BigDecimal("8")), 10, RoundingMode.HALF_UP);
            }

            BigDecimal otNormHours = attendance.getOtNormalHours() != null ? attendance.getOtNormalHours()
                    : BigDecimal.ZERO;
            BigDecimal otWeekHours = attendance.getOtWeekendHours() != null ? attendance.getOtWeekendHours()
                    : BigDecimal.ZERO;
            BigDecimal otHoliHours = attendance.getOtHolidayHours() != null ? attendance.getOtHolidayHours()
                    : BigDecimal.ZERO;

            BigDecimal otNormal = hourlyRate.multiply(new BigDecimal("1.5")).multiply(otNormHours).setScale(0,
                    RoundingMode.HALF_UP);
            BigDecimal otWeekend = hourlyRate.multiply(new BigDecimal("2.0")).multiply(otWeekHours).setScale(0,
                    RoundingMode.HALF_UP);
            BigDecimal otHoliday = hourlyRate.multiply(new BigDecimal("3.0")).multiply(otHoliHours).setScale(0,
                    RoundingMode.HALF_UP);

            payroll.setOtNormalPay(otNormal);
            payroll.setOtWeekendPay(otWeekend);
            payroll.setOtHolidayPay(otHoliday);
            payroll.setOtPay(otNormal.add(otWeekend).add(otHoliday));
            payroll.setOtNormalHours(otNormHours);
            payroll.setOtWeekendHours(otWeekHours);
            payroll.setOtHolidayHours(otHoliHours);

            // Phần chênh lệch OT miễn thuế: (0.5 * otNorm + 1.0 * otWeek + 2.0 * otHoli) *
            // hourlyRate
            BigDecimal otPremium = hourlyRate.multiply(
                    new BigDecimal("0.5").multiply(otNormHours)
                            .add(new BigDecimal("1.0").multiply(otWeekHours))
                            .add(new BigDecimal("2.0").multiply(otHoliHours)))
                    .setScale(0, RoundingMode.HALF_UP);
            payroll.setOtPremiumPay(otPremium);

            // Bước 5.5: Tính tổng thu nhập Gross
            BigDecimal grossIncome = baseSalary.add(mealAllowance)
                    .add(payroll.getSeniorityAllowance())
                    .add(payroll.getOtherAllowances())
                    .add(payroll.getBonus())
                    .add(payroll.getOtPay())
                    .subtract(payroll.getPenalty());

            if (grossIncome.compareTo(BigDecimal.ZERO) < 0)
                grossIncome = BigDecimal.ZERO;
            payroll.setGrossIncome(grossIncome);

            // Bước 5.6: Trích các khoản đóng bảo hiểm xã hội bắt buộc (NLĐ & DN)
            BigDecimal bhxhEE = BigDecimal.ZERO, bhytEE = BigDecimal.ZERO, bhtnEE = BigDecimal.ZERO;
            BigDecimal bhxhER = BigDecimal.ZERO, bhytER = BigDecimal.ZERO, bhtnER = BigDecimal.ZERO,
                    kpcdER = BigDecimal.ZERO;

            if (emp.getEmployeeType() == EmployeeType.FULL_TIME) {
                BigDecimal ceiling = params.getInsuranceCeiling() != null ? params.getInsuranceCeiling()
                        : new BigDecimal("36000000");
                BigDecimal insuranceSalary = contractSal.compareTo(ceiling) < 0 ? contractSal : ceiling;

                BigDecimal bhxhEE_rate = approvedInsurance.getBhxhEmployee() != null
                        ? approvedInsurance.getBhxhEmployee()
                        : new BigDecimal("8.0");
                BigDecimal bhytEE_rate = approvedInsurance.getBhytEmployee() != null
                        ? approvedInsurance.getBhytEmployee()
                        : new BigDecimal("1.5");
                BigDecimal bhtnEE_rate = approvedInsurance.getBhtnEmployee() != null
                        ? approvedInsurance.getBhtnEmployee()
                        : new BigDecimal("1.0");

                BigDecimal bhxhER_rate = approvedInsurance.getBhxhEmployer() != null
                        ? approvedInsurance.getBhxhEmployer()
                        : new BigDecimal("17.5");
                BigDecimal bhytER_rate = approvedInsurance.getBhytEmployer() != null
                        ? approvedInsurance.getBhytEmployer()
                        : new BigDecimal("3.0");
                BigDecimal bhtnER_rate = approvedInsurance.getBhtnEmployer() != null
                        ? approvedInsurance.getBhtnEmployer()
                        : new BigDecimal("1.0");
                BigDecimal kpcdER_rate = approvedInsurance.getKpcdEmployer() != null
                        ? approvedInsurance.getKpcdEmployer()
                        : new BigDecimal("2.0");

                bhxhEE = insuranceSalary.multiply(bhxhEE_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhytEE = insuranceSalary.multiply(bhytEE_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhtnEE = insuranceSalary.multiply(bhtnEE_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

                bhxhER = insuranceSalary.multiply(bhxhER_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhytER = insuranceSalary.multiply(bhytER_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhtnER = insuranceSalary.multiply(bhtnER_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                kpcdER = insuranceSalary.multiply(kpcdER_rate).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
            }

            payroll.setBhxhNhanVien(bhxhEE);
            payroll.setBhytNhanVien(bhytEE);
            payroll.setBhtnNhanVien(bhtnEE);
            payroll.setTotalInsurance(bhxhEE.add(bhytEE).add(bhtnEE));
            payroll.setBhxhCongTy(bhxhER);
            payroll.setBhytCongTy(bhytER);
            payroll.setBhtnCongTy(bhtnER);
            payroll.setKpcdCongTy(kpcdER);
            payroll.setTotalEmployerInsurance(bhxhER.add(bhytER).add(bhtnER).add(kpcdER));

            // Bước 5.7: Tính toán giảm trừ gia cảnh và Thuế thu nhập cá nhân (TNCN)
            BigDecimal otPremiumVal = payroll.getOtPremiumPay() != null ? payroll.getOtPremiumPay() : BigDecimal.ZERO;
            BigDecimal taxableIncomeBase = grossIncome.subtract(mealAllowance).subtract(otPremiumVal);
            BigDecimal dSelf = approvedDeductions.getPersonalDeduction() != null
                    ? approvedDeductions.getPersonalDeduction()
                    : new BigDecimal("11000000");
            BigDecimal dDep = new BigDecimal(emp.getDependentCount() != null ? emp.getDependentCount() : 0)
                    .multiply(approvedDeductions.getDependentDeduction() != null
                            ? approvedDeductions.getDependentDeduction()
                            : new BigDecimal("4400000"));

            BigDecimal taxableIncome = taxableIncomeBase.subtract(dSelf).subtract(dDep)
                    .subtract(payroll.getTotalInsurance())
                    .subtract(payroll.getCharityDeduction() != null ? payroll.getCharityDeduction() : BigDecimal.ZERO);

            if (taxableIncome.compareTo(BigDecimal.ZERO) < 0)
                taxableIncome = BigDecimal.ZERO;

            payroll.setTaxableIncomeBase(taxableIncomeBase);
            payroll.setPersonalDeduction(dSelf);
            payroll.setDependentDeduction(dDep);
            payroll.setDependentCount(emp.getDependentCount() != null ? emp.getDependentCount() : 0);

            EmployeeTaxConfig taxConfig = taxConfigMap.getOrDefault(emp.getEmployeeType(),
                    new EmployeeTaxConfig(null, emp.getEmployeeType(), TaxMethod.PROGRESSIVE, "APPROVED"));
            BigDecimal taxAmount = BigDecimal.ZERO;
            if (taxConfig.getTaxMethod() == TaxMethod.PROGRESSIVE) {
                taxAmount = calculatePITOptimized(taxableIncome, approvedTaxTiers);
            } else if (taxConfig.getTaxMethod() == TaxMethod.FIXED_10
                    && grossIncome.compareTo(new BigDecimal("2000000")) >= 0) {
                taxAmount = grossIncome.multiply(new BigDecimal("0.1")).setScale(0, RoundingMode.HALF_UP);
            }

            // Bước 5.8: Tính lương thực nhận (Net) và đặt trạng thái nháp (DRAFT)
            payroll.setTaxableIncome(taxableIncome);
            payroll.setTaxAmount(taxAmount);
            payroll.setNetPay(grossIncome.subtract(payroll.getTotalInsurance()).subtract(taxAmount));
            payroll.setStatus(PayrollStatus.DRAFT);
            toSave.add(payroll);
        }
        // Bước 6: Lưu tất cả kết quả tính lương của tháng vào cơ sở dữ liệu
        payrollRepository.saveAll(toSave);
        System.out.println("Payroll Calculation completed successfully for " + toSave.size() + " records.");
    }

    // Tính toán thuế thu nhập cá nhân (PIT) tối ưu dựa trên biểu thuế lũy tiến từng
    // phần
    private BigDecimal calculatePITOptimized(BigDecimal income, List<TaxTier> tiers) {
        if (income.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;
        if (tiers.isEmpty()) {
            if (income.compareTo(new BigDecimal("10000000")) <= 0)
                return income.multiply(new BigDecimal("0.05")).setScale(0, RoundingMode.HALF_UP);
            if (income.compareTo(new BigDecimal("30000000")) <= 0)
                return income.multiply(new BigDecimal("0.10")).subtract(new BigDecimal("500000")).setScale(0,
                        RoundingMode.HALF_UP);
            if (income.compareTo(new BigDecimal("60000000")) <= 0)
                return income.multiply(new BigDecimal("0.20")).subtract(new BigDecimal("3500000")).setScale(0,
                        RoundingMode.HALF_UP);
            if (income.compareTo(new BigDecimal("100000000")) <= 0)
                return income.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("9500000")).setScale(0,
                        RoundingMode.HALF_UP);
            return income.multiply(new BigDecimal("0.35")).subtract(new BigDecimal("14500000")).setScale(0,
                    RoundingMode.HALF_UP);
        }

        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal remainingIncome = income;
        for (TaxTier tier : tiers) {
            BigDecimal lBound = tier.getLowerBound() != null ? tier.getLowerBound() : BigDecimal.ZERO;
            BigDecimal uBound = (tier.getUpperBound() == null || tier.getUpperBound().compareTo(BigDecimal.ZERO) <= 0)
                    ? new BigDecimal("999999999999")
                    : tier.getUpperBound();
            BigDecimal tierSpan = uBound.subtract(lBound);
            BigDecimal taxRate = tier.getTaxRate().divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);

            if (remainingIncome.compareTo(tierSpan) > 0 && tierSpan.compareTo(BigDecimal.ZERO) > 0) {
                tax = tax.add(tierSpan.multiply(taxRate));
                remainingIncome = remainingIncome.subtract(tierSpan);
            } else {
                tax = tax.add(remainingIncome.multiply(taxRate));
                break;
            }
        }
        return tax.setScale(0, RoundingMode.HALF_UP);
    }

    // Tính số ngày làm việc thực tế (Thứ 2 đến Thứ 6) của tháng và năm chỉ định
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

    // Lấy lương hợp đồng tại một thời điểm chỉ định dựa trên lịch sử biến động lương
    private BigDecimal getContractSalaryAt(Employee emp, LocalDate targetDate, List<SalaryChange> adjustments) {
        if (adjustments == null || adjustments.isEmpty()) {
            return emp.getContractSalary() != null ? emp.getContractSalary() : BigDecimal.ZERO;
        }

        SalaryChange latestBeforeOrOnTarget = null;
        for (SalaryChange change : adjustments) {
            if (!change.getEffectiveDate().isAfter(targetDate)) {
                latestBeforeOrOnTarget = change;
            } else {
                // Do danh sách biến động được sắp xếp tăng dần theo ngày hiệu lực,
                // biến động đầu tiên sau ngày targetDate sẽ cho biết mức lương cũ ngay trước khi có biến động đó.
                if (latestBeforeOrOnTarget == null) {
                    return change.getOldValue() != null ? change.getOldValue() : BigDecimal.ZERO;
                }
                break;
            }
        }

        if (latestBeforeOrOnTarget != null) {
            return latestBeforeOrOnTarget.getNewValue() != null ? latestBeforeOrOnTarget.getNewValue() : BigDecimal.ZERO;
        }

        return emp.getContractSalary() != null ? emp.getContractSalary() : BigDecimal.ZERO;
    }

    // Khởi tạo các thông số lương mặc định phòng hờ khi chưa cấu hình hệ thống
    private SalaryParameter defaultParams() {
        SalaryParameter p = new SalaryParameter();
        p.setStandardWorkDays(new BigDecimal("26.0"));
        p.setStandardWorkDayMode("FIXED");
        p.setMinimumWage(new BigDecimal("1800000"));
        p.setMealAllowance(new BigDecimal("25000"));
        return p;
    }
}
