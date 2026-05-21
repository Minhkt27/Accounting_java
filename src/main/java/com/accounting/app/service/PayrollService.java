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
    private EmployeeRepository repoNhanVien;
    @Autowired
    private AttendanceRepository repoChamCong;
    @Autowired
    private PayrollRepository repoBangLuong;
    @Autowired
    private SalaryParameterRepository repoThamSoLuong;
    @Autowired
    private TaxTierRepository repoBacThue;
    @Autowired
    private AttendanceService dichVuChamCong;
    @Autowired
    private SalaryChangeRepository repoBienDongLuong;

    @Autowired
    private VoucherRepository repoChungTu;
    @Autowired
    private JournalEntryRepository repoNhatKyChung;
    @Autowired
    private AccountCategoryRepository repoTaiKhoan;
    @Autowired
    private DeductionSettingRepository repoKhauTru;
    @Autowired
    private EmployeeTaxConfigRepository repoCauHinhThue;
    @Autowired
    private InsuranceConfigRepository repoCauHinhBaoHiem;

    // Phê duyệt bảng lương tháng và năm, thực hiện trích các khoản lương, bảo hiểm,
    // thuế liên quan
    @Transactional
    public void approveMonthlyPayroll(Integer thang, Integer nam) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra tính hợp lệ
        List<Payroll> danhSachBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam);
        if (danhSachBangLuong.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để phê duyệt");

        // Bước 2: Đảm bảo bảng lương đang ở trạng thái DRAFT
        boolean tatCaLaBanNhap = danhSachBangLuong.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!tatCaLaBanNhap)
            throw new RuntimeException("Chỉ được phê duyệt bảng lương đang ở trạng thái DRAFT");

        // Bước 3: Tính toán tổng tiền lương Gross, bảo hiểm và thuế TNCN của cả công ty
        BigDecimal tongLuongGross = danhSachBangLuong.stream().map(Payroll::getGrossIncome).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tongBaoHiemNhanVien = danhSachBangLuong.stream().map(Payroll::getTotalInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal tongBaoHiemCongTy = danhSachBangLuong.stream().map(Payroll::getTotalEmployerInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal tongThueTncn = danhSachBangLuong.stream().map(Payroll::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bước 4: Lấy các tài khoản kế toán tương ứng từ danh mục tài khoản
        AccountCategory taiKhoan642 = repoTaiKhoan.findById("642")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 642"));
        AccountCategory taiKhoan334 = repoTaiKhoan.findById("334")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory taiKhoan338 = repoTaiKhoan.findById("338")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory taiKhoan3335 = repoTaiKhoan.findById("3335")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));

        // Bước 5: Ghi nhận chứng từ chi phí lương (Nợ 642 / Có 334)
        String soChungTuChiPhi = String.format("PK-LUONG-%02d-%d", thang, nam % 100);
        Voucher chungTuChiPhi = new Voucher(soChungTuChiPhi, "PHIEU_KE_TOAN", LocalDate.now(), tongLuongGross,
                "Trích chi phí tiền lương phải trả tháng " + thang + "/" + nam);
        chungTuChiPhi.setTargetMonth(thang);
        chungTuChiPhi.setTargetYear(nam);
        chungTuChiPhi = repoChungTu.save(chungTuChiPhi);

        repoNhatKyChung.save(new JournalEntry(chungTuChiPhi, taiKhoan642, taiKhoan334, tongLuongGross, "Chi phí lương tháng " + thang));

        // Bước 6: Ghi nhận chứng từ trích các khoản khấu trừ lương của người lao động
        // (BHXH, Thuế TNCN)
        BigDecimal tongKhoanKhauTru = tongBaoHiemNhanVien.add(tongThueTncn);
        if (tongKhoanKhauTru.compareTo(BigDecimal.ZERO) > 0) {
            String soChungTuKhauTru = String.format("PK-KHAUTRU-%02d-%d", thang, nam % 100);
            Voucher chungTuKhauTru = new Voucher(soChungTuKhauTru, "PHIEU_KE_TOAN", LocalDate.now(), tongKhoanKhauTru,
                    "Trích các khoản khấu trừ lương NLĐ tháng " + thang + "/" + nam);
            chungTuKhauTru.setTargetMonth(thang);
            chungTuKhauTru.setTargetYear(nam);
            chungTuKhauTru = repoChungTu.save(chungTuKhauTru);

            if (tongBaoHiemNhanVien.compareTo(BigDecimal.ZERO) > 0)
                repoNhatKyChung.save(new JournalEntry(chungTuKhauTru, taiKhoan334, taiKhoan338, tongBaoHiemNhanVien,
                        "Trích BHXH, BHYT, BHTN phần NLĐ (10.5%) tháng " + thang));
            if (tongThueTncn.compareTo(BigDecimal.ZERO) > 0)
                repoNhatKyChung.save(new JournalEntry(chungTuKhauTru, taiKhoan334, taiKhoan3335, tongThueTncn, "Trích thuế TNCN tháng " + thang));
        }

        // Bước 7: Ghi nhận chứng từ chi phí bảo hiểm và kinh phí công đoàn phần doanh
        // nghiệp đóng (Nợ 642 / Có 338)
        if (tongBaoHiemCongTy.compareTo(BigDecimal.ZERO) > 0) {
            String soChungTuBaoHiemDn = String.format("PK-BHDN-%02d-%d", thang, nam % 100);
            Voucher chungTuBaoHiemDn = new Voucher(soChungTuBaoHiemDn, "PHIEU_KE_TOAN", LocalDate.now(), tongBaoHiemCongTy,
                    "Trích chi phí BHXH, BHYT, BHTN, KPCĐ phần DN tháng " + thang + "/" + nam);
            chungTuBaoHiemDn.setTargetMonth(thang);
            chungTuBaoHiemDn.setTargetYear(nam);
            chungTuBaoHiemDn = repoChungTu.save(chungTuBaoHiemDn);

            repoNhatKyChung.save(new JournalEntry(chungTuBaoHiemDn, taiKhoan642, taiKhoan338, tongBaoHiemCongTy,
                    "Chi phí BH & KPCĐ phần DN (23.5%) tháng " + thang));
        }

        // Bước 8: Cập nhật trạng thái bảng lương thành APPROVED và lưu thông tin người
        // phê duyệt
        danhSachBangLuong.forEach(p -> {
            p.setStatus(PayrollStatus.APPROVED);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        repoBangLuong.saveAll(danhSachBangLuong);
    }

    // Từ chối phê duyệt bảng lương tháng và năm với lý do cụ thể
    @Transactional
    public void rejectMonthlyPayroll(Integer thang, Integer nam, String lyDo) {
        // Bước 1: Lấy danh sách bảng lương tháng cần từ chối
        List<Payroll> danhSachBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam);
        if (danhSachBangLuong.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để từ chối");

        // Bước 2: Kiểm tra đảm bảo bảng lương đang ở trạng thái nháp DRAFT
        boolean tatCaLaBanNhap = danhSachBangLuong.stream().allMatch(p -> p.getStatus() == PayrollStatus.DRAFT);
        if (!tatCaLaBanNhap)
            throw new RuntimeException("Chỉ được từ chối bảng lương đang ở trạng thái DRAFT");

        // Bước 3: Cập nhật trạng thái bảng lương sang REJECTED cùng lý do và lưu lại
        danhSachBangLuong.forEach(p -> {
            p.setStatus(PayrollStatus.REJECTED);
            p.setRejectionReason(lyDo);
            p.setApprovedBy("KE_TOAN_TRUONG");
            p.setApprovedAt(java.time.LocalDateTime.now());
        });
        repoBangLuong.saveAll(danhSachBangLuong);
    }

    // Thực hiện thanh toán lương cho nhân viên và hạch toán chứng từ kế toán
    @Transactional
    public void payMonthlyPayroll(Integer thang, Integer nam, String phuongThucThanhToan) {
        // Bước 1: Lấy danh sách bảng lương tháng cần thanh toán
        List<Payroll> danhSachBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam);
        if (danhSachBangLuong.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương để thanh toán");

        // Bước 2: Đảm bảo bảng lương đã được phê duyệt (APPROVED) hoặc đã thanh toán
        boolean tatCaDaDuyet = danhSachBangLuong.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!tatCaDaDuyet)
            throw new RuntimeException("Chỉ được thanh toán sau khi bảng lương đã được Phê duyệt (APPROVED)");

        // Bước 3: Tính tổng số tiền lương Net cần thanh toán thực tế
        BigDecimal tongNet = danhSachBangLuong.stream().map(Payroll::getNetPay).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Bước 4: Tạo chứng từ chi tiền mặt (PHIEU_CHI) hoặc ủy nhiệm chi (UNC)
        String tienTo = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PC" : "UNC";
        String loaiChungTu = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PHIEU_CHI" : "UNC";
        String soChungTu = String.format("%s-LUONG-%02d-%d", tienTo, thang, nam % 100);

        Voucher chungTu = new Voucher(soChungTu, loaiChungTu, LocalDate.now(), tongNet,
                "Thanh toán lương tháng " + thang + "/" + nam);
        chungTu.setTargetMonth(thang);
        chungTu.setTargetYear(nam);
        chungTu = repoChungTu.save(chungTu);

        // Bước 5: Hạch toán kế toán thực chi lương (Nợ 334 / Có 111 hoặc 112)
        AccountCategory taiKhoan334 = repoTaiKhoan.findById("334")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 334"));
        AccountCategory taiKhoanPhuongThuc = repoTaiKhoan.findById("PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        repoNhatKyChung.save(new JournalEntry(chungTu, taiKhoan334, taiKhoanPhuongThuc, tongNet, "Thực chi tiền lương tháng " + thang));

        // Bước 6: Cập nhật trạng thái bảng lương của từng nhân viên thành PAID và lưu lại
        danhSachBangLuong.forEach(p -> p.setStatus(PayrollStatus.PAID));
        repoBangLuong.saveAll(danhSachBangLuong);
    }

    // Nộp các khoản bảo hiểm bắt buộc tháng và hạch toán chứng từ kế toán tương ứng
    @Transactional
    public void payInsurance(Integer thang, Integer nam, String phuongThucThanhToan) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra hợp lệ
        List<Payroll> danhSachBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam);
        if (danhSachBangLuong.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương");

        // Bước 2: Đảm bảo bảng lương đã được duyệt hoặc thanh toán lương
        boolean hopLe = danhSachBangLuong.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!hopLe)
            throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        // Bước 3: Tính tổng số tiền bảo hiểm phải nộp (của cả nhân viên đóng và công ty đóng)
        BigDecimal tongBaoHiemNhanVien = danhSachBangLuong.stream().map(Payroll::getTotalInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal tongBaoHiemCongTy = danhSachBangLuong.stream().map(Payroll::getTotalEmployerInsurance).reduce(BigDecimal.ZERO,
                BigDecimal::add);
        BigDecimal tongBaoHiem = tongBaoHiemNhanVien.add(tongBaoHiemCongTy);

        if (tongBaoHiem.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Không có khoản bảo hiểm cần thanh toán");

        // Bước 4: Tạo chứng từ chi nộp bảo hiểm (PHIEU_CHI hoặc UNC)
        String tienTo = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PC" : "UNC";
        String loaiChungTu = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PHIEU_CHI" : "UNC";
        String soChungTu = String.format("%s-BH-%02d-%d", tienTo, thang, nam % 100);

        Voucher chungTu = new Voucher(soChungTu, loaiChungTu, LocalDate.now(), tongBaoHiem,
                "Nộp bảo hiểm tháng " + thang + "/" + nam + " (NLĐ + DN)");
        chungTu.setTargetMonth(thang);
        chungTu.setTargetYear(nam);
        chungTu = repoChungTu.save(chungTu);

        // Bước 5: Hạch toán nộp tiền bảo hiểm lên cơ quan bảo hiểm (Nợ 338 / Có 111 hoặc 112)
        AccountCategory taiKhoan338 = repoTaiKhoan.findById("338")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 338"));
        AccountCategory taiKhoanPhuongThuc = repoTaiKhoan.findById("PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        repoNhatKyChung.save(
                new JournalEntry(chungTu, taiKhoan338, taiKhoanPhuongThuc, tongBaoHiem, "Nộp BHXH, BHYT, BHTN, KPCĐ tháng " + thang));
    }

    // Nộp thuế TNCN tháng của nhân viên và hạch toán chứng từ kế toán tương ứng
    @Transactional
    public void payTax(Integer thang, Integer nam, String phuongThucThanhToan) {
        // Bước 1: Lấy danh sách bảng lương tháng và kiểm tra hợp lệ
        List<Payroll> danhSachBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam);
        if (danhSachBangLuong.isEmpty())
            throw new RuntimeException("Không tìm thấy bảng lương");

        // Bước 2: Đảm bảo bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương
        boolean hopLe = danhSachBangLuong.stream()
                .allMatch(p -> p.getStatus() == PayrollStatus.APPROVED || p.getStatus() == PayrollStatus.PAID);
        if (!hopLe)
            throw new RuntimeException("Bảng lương phải ở trạng thái Đã duyệt hoặc Đã thanh toán lương");

        // Bước 3: Tính tổng số tiền thuế TNCN phải nộp
        BigDecimal tongThue = danhSachBangLuong.stream().map(Payroll::getTaxAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (tongThue.compareTo(BigDecimal.ZERO) <= 0)
            throw new RuntimeException("Không có khoản thuế TNCN cần nộp");

        // Bước 4: Tạo chứng từ chi nộp thuế TNCN (PHIEU_CHI hoặc UNC)
        String tienTo = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PC" : "UNC";
        String loaiChungTu = "PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "PHIEU_CHI" : "UNC";
        String soChungTu = String.format("%s-THUE-%02d-%d", tienTo, thang, nam % 100);

        Voucher chungTu = new Voucher(soChungTu, loaiChungTu, LocalDate.now(), tongThue,
                "Nộp thuế TNCN tháng " + thang + "/" + nam);
        chungTu.setTargetMonth(thang);
        chungTu.setTargetYear(nam);
        chungTu = repoChungTu.save(chungTu);

        // Bước 5: Hạch toán nộp tiền thuế TNCN vào Ngân sách Nhà nước (Nợ 3335 / Có 111 hoặc 112)
        AccountCategory taiKhoan3335 = repoTaiKhoan.findById("3335")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản 3335"));
        AccountCategory taiKhoanPhuongThuc = repoTaiKhoan.findById("PAYMENT".equalsIgnoreCase(phuongThucThanhToan) ? "111" : "112")
                .orElseThrow(() -> new RuntimeException("Thiếu tài khoản thanh toán (111/112)"));

        repoNhatKyChung.save(new JournalEntry(chungTu, taiKhoan3335, taiKhoanPhuongThuc, tongThue, "Nộp thuế TNCN tháng " + thang));
    }

    // Tính toán chi tiết bảng lương tháng cho toàn bộ nhân viên
    @Transactional
    public void calculateMonthlyPayroll(Integer thang, Integer nam) {
        // Bước 1: Kiểm tra tính hợp lệ của thời gian tính lương
        LocalDate ngayHienTai = LocalDate.now();
        int giaTriThangHienTai = ngayHienTai.getYear() * 12 + ngayHienTai.getMonthValue();
        int giaTriThangCanTinh = nam * 12 + thang;

        System.out.println("Payroll Check: Target=" + giaTriThangCanTinh + " vs Current=" + giaTriThangHienTai);

        if (giaTriThangCanTinh > giaTriThangHienTai) {
            throw new RuntimeException("Không thể tính lương cho tháng tương lai (Yêu cầu: " + thang + "/" + nam
                    + ", Hiện tại: " + ngayHienTai.getMonthValue() + "/" + ngayHienTai.getYear() + ")");
        }

        // Bước 2: Kiểm tra dữ liệu chấm công của tháng
        List<Attendance> danhSachChamCong = repoChamCong.findAllByMonthAndYearSortedList(thang, nam);
        if (danhSachChamCong.isEmpty()) {
            throw new RuntimeException("Chưa hoàn tất chấm công cho tháng " + thang + "/" + nam
                    + ". Vui lòng thực hiện chấm công và lưu lại trước khi tính lương.");
        }

        // Bước 3: Thu thập cấu hình hệ thống và dữ liệu đầu vào (Bulk Fetching)
        System.out.println("Processing Payroll Calculation for: Month=" + thang + ", Year=" + nam);

        SalaryParameter thamSoLuong = repoThamSoLuong.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus()))
                .findFirst().orElse(defaultParams());

        List<Employee> danhSachNhanVien = repoNhanVien.findAllSortedList();

        // Fetch all data for this month in one go
        java.util.Map<String, Attendance> banDoChamCong = repoChamCong
                .findAllByMonthAndYearSortedList(thang, nam)
                .stream()
                .collect(java.util.stream.Collectors.toMap(a -> a.getEmployee().getId(), a -> a, (a1, a2) -> a1));

        java.util.Map<String, Payroll> banDoBangLuong = repoBangLuong.findByMonthAndYearSortedList(thang, nam)
                .stream()
                .collect(java.util.stream.Collectors.toMap(p -> p.getEmployee().getId(), p -> p, (p1, p2) -> p1));

        LocalDate ngayDauThang = LocalDate.of(nam, thang, 1);
        LocalDate ngayCuoiThang = ngayDauThang.withDayOfMonth(ngayDauThang.lengthOfMonth());
        java.util.Map<String, List<SalaryChange>> banDoBienDongThang = repoBienDongLuong
                .findAllApprovedInMonth(ngayDauThang, ngayCuoiThang)
                .stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getEmployee().getId()));

        java.util.Map<String, List<SalaryChange>> banDoDieuChinhLuong = repoBienDongLuong
                .findAllApprovedSalaryAdjustments()
                .stream().collect(java.util.stream.Collectors.groupingBy(c -> c.getEmployee().getId()));

        java.util.Map<EmployeeType, EmployeeTaxConfig> banDoCauHinhThue = repoCauHinhThue.findAll()
                .stream().collect(java.util.stream.Collectors.toMap(c -> c.getEmployeeType(), c -> c, (c1, c2) -> c1));

        // Pre-fetch tax tiers
        List<TaxTier> bacThueDaDuyet = repoBacThue.findAll().stream()
                .filter(t -> "APPROVED".equals(t.getStatus()))
                .sorted(Comparator.comparing(TaxTier::getTierLevel))
                .collect(Collectors.toList());

        DeductionSetting khoanGiamTruDaDuyet = repoKhauTru.findAll().stream()
                .filter(d -> "APPROVED".equals(d.getStatus()))
                .findFirst()
                .orElse(new DeductionSetting(null, new BigDecimal("11000000"), new BigDecimal("4400000"), "APPROVED"));

        InsuranceConfig cauHinhBaoHiemDaDuyet = repoCauHinhBaoHiem.findAll().stream()
                .filter(c -> "APPROVED".equals(c.getStatus()))
                .findFirst().orElse(new InsuranceConfig());

        // Bước 4: Xác định số ngày công chuẩn trong tháng
        BigDecimal soNgayCongChuan = thamSoLuong.getStandardWorkDays();
        if ("MONTHLY".equalsIgnoreCase(thamSoLuong.getStandardWorkDayMode())) {
            soNgayCongChuan = new BigDecimal(calculateBusinessDays(thang, nam));
        }

        java.util.List<Payroll> danhSachCanLuu = new java.util.ArrayList<>();

        // Bước 5: Duyệt danh sách nhân viên để tính toán lương chi tiết
        for (Employee nhanVien : danhSachNhanVien) {
            if (!nhanVien.getActive()) {
                if (nhanVien.getResignationDate() != null) {
                    int thangNghiViec = nhanVien.getResignationDate().getMonthValue();
                    int namNghiViec = nhanVien.getResignationDate().getYear();
                    if (namNghiViec < nam || (namNghiViec == nam && thangNghiViec < thang))
                        continue;
                } else
                    continue;
            }

            // Bước 5.1: Lấy thông tin ngày công thực tế và ngày nghỉ phép hưởng lương
            Attendance thongTinChamCong = banDoChamCong.get(nhanVien.getId());
            BigDecimal soNgayLamThucTe;
            BigDecimal soNgayNghiCoLuong;
            if (thongTinChamCong != null) {
                soNgayLamThucTe = thongTinChamCong.getRealWorkDays() != null ? thongTinChamCong.getRealWorkDays() : BigDecimal.ZERO;
                soNgayNghiCoLuong = thongTinChamCong.getPaidLeaveDays() != null ? thongTinChamCong.getPaidLeaveDays() : BigDecimal.ZERO;
            } else {
                com.accounting.app.dto.AttendanceSuggestion goiYChamCong = dichVuChamCong
                        .getAttendanceSuggestion(nhanVien.getId(), thang, nam, soNgayCongChuan);
                soNgayLamThucTe = goiYChamCong.getPhysicalDays();
                soNgayNghiCoLuong = goiYChamCong.getPaidLeaveDays();
                thongTinChamCong = new Attendance(nhanVien, thang, nam, soNgayLamThucTe, soNgayNghiCoLuong, BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO);
                thongTinChamCong = repoChamCong.save(thongTinChamCong);
                banDoChamCong.put(nhanVien.getId(), thongTinChamCong);
            }

            Payroll bangLuongNhanVien = banDoBangLuong.getOrDefault(nhanVien.getId(), new Payroll());
            bangLuongNhanVien.setEmployee(nhanVien);
            bangLuongNhanVien.setMonth(thang);
            bangLuongNhanVien.setYear(nam);

            List<SalaryChange> lichSuDieuChinh = banDoDieuChinhLuong.getOrDefault(nhanVien.getId(), List.of());
            BigDecimal luongHopDong = getContractSalaryAt(nhanVien, ngayCuoiThang, lichSuDieuChinh);

            bangLuongNhanVien.setContractSalary(luongHopDong);
            bangLuongNhanVien.setRealWorkDays(soNgayLamThucTe);
            bangLuongNhanVien.setPaidLeaveDays(soNgayNghiCoLuong);
            bangLuongNhanVien.setStandardWorkDays(soNgayCongChuan);

            // Bước 5.2: Tính lương thời gian (Lương cơ bản thực tế)
            BigDecimal tongSoNgayTinhLuong = soNgayLamThucTe.add(soNgayNghiCoLuong != null ? soNgayNghiCoLuong : BigDecimal.ZERO);

            // Lương chính = (Lương HĐ / Standard) * tongSoNgayTinhLuong
            BigDecimal luongChinhThucTe = BigDecimal.ZERO;
            if (soNgayCongChuan.compareTo(BigDecimal.ZERO) > 0) {
                luongChinhThucTe = luongHopDong.divide(soNgayCongChuan, 10, RoundingMode.HALF_UP).multiply(tongSoNgayTinhLuong)
                        .setScale(0, RoundingMode.HALF_UP);
            }

            if (nhanVien.getEmployeeType() == EmployeeType.PROBATION) {
                luongChinhThucTe = luongChinhThucTe.multiply(new BigDecimal("0.85")).setScale(0, RoundingMode.HALF_UP);
            }
            bangLuongNhanVien.setBaseSalaryPay(luongChinhThucTe);

            // Bước 5.3: Tính các phụ cấp (phụ cấp ăn trưa, thâm niên) và tiền thưởng/phạt
            BigDecimal phuCapAnTrua = (thamSoLuong.getMealAllowance() != null ? thamSoLuong.getMealAllowance() : BigDecimal.ZERO)
                    .multiply(soNgayLamThucTe).setScale(0, RoundingMode.HALF_UP);
            bangLuongNhanVien.setMealAllowance(phuCapAnTrua);
            bangLuongNhanVien.setPositionAllowance(BigDecimal.ZERO);
            bangLuongNhanVien.setSeniorityAllowance(
                    nhanVien.getSeniorityAllowance() != null ? nhanVien.getSeniorityAllowance() : BigDecimal.ZERO);
            if (bangLuongNhanVien.getOtherAllowances() == null)
                bangLuongNhanVien.setOtherAllowances(BigDecimal.ZERO);

            // Salary Changes (Rewards/Disciplines)
            List<SalaryChange> danhSachBienDong = banDoBienDongThang.getOrDefault(nhanVien.getId(), List.of());
            bangLuongNhanVien.setBonus(danhSachBienDong.stream().filter(c -> "REWARD".equals(c.getChangeType()))
                    .map(c -> c.getNewValue() != null ? c.getNewValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            bangLuongNhanVien.setPenalty(danhSachBienDong.stream().filter(c -> "DISCIPLINE".equals(c.getChangeType()))
                    .map(c -> c.getNewValue() != null ? c.getNewValue() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            if (bangLuongNhanVien.getCharityDeduction() == null)
                bangLuongNhanVien.setCharityDeduction(BigDecimal.ZERO);

            // Bước 5.4: Tính lương làm thêm giờ (OT) và phần chênh lệch OT miễn thuế
            BigDecimal luongTheoGio = BigDecimal.ZERO;
            if (soNgayCongChuan.compareTo(BigDecimal.ZERO) > 0) {
                luongTheoGio = luongHopDong.divide(soNgayCongChuan.multiply(new BigDecimal("8")), 10, RoundingMode.HALF_UP);
            }

            BigDecimal soGioTangCaNgayThuong = thongTinChamCong.getOtNormalHours() != null ? thongTinChamCong.getOtNormalHours()
                    : BigDecimal.ZERO;
            BigDecimal soGioTangCaCuoiTuan = thongTinChamCong.getOtWeekendHours() != null ? thongTinChamCong.getOtWeekendHours()
                    : BigDecimal.ZERO;
            BigDecimal soGioTangCaNgayLe = thongTinChamCong.getOtHolidayHours() != null ? thongTinChamCong.getOtHolidayHours()
                    : BigDecimal.ZERO;

            BigDecimal tienTangCaNgayThuong = luongTheoGio.multiply(new BigDecimal("1.5")).multiply(soGioTangCaNgayThuong).setScale(0,
                    RoundingMode.HALF_UP);
            BigDecimal tienTangCaCuoiTuan = luongTheoGio.multiply(new BigDecimal("2.0")).multiply(soGioTangCaCuoiTuan).setScale(0,
                    RoundingMode.HALF_UP);
            BigDecimal tienTangCaNgayLe = luongTheoGio.multiply(new BigDecimal("3.0")).multiply(soGioTangCaNgayLe).setScale(0,
                    RoundingMode.HALF_UP);

            bangLuongNhanVien.setOtNormalPay(tienTangCaNgayThuong);
            bangLuongNhanVien.setOtWeekendPay(tienTangCaCuoiTuan);
            bangLuongNhanVien.setOtHolidayPay(tienTangCaNgayLe);
            bangLuongNhanVien.setOtPay(tienTangCaNgayThuong.add(tienTangCaCuoiTuan).add(tienTangCaNgayLe));
            bangLuongNhanVien.setOtNormalHours(soGioTangCaNgayThuong);
            bangLuongNhanVien.setOtWeekendHours(soGioTangCaCuoiTuan);
            bangLuongNhanVien.setOtHolidayHours(soGioTangCaNgayLe);

            // Phần chênh lệch OT miễn thuế: (0.5 * otNorm + 1.0 * otWeek + 2.0 * otHoli) *
            // luongTheoGio
            BigDecimal tienTangCaMienThue = luongTheoGio.multiply(
                    new BigDecimal("0.5").multiply(soGioTangCaNgayThuong)
                            .add(new BigDecimal("1.0").multiply(soGioTangCaCuoiTuan))
                            .add(new BigDecimal("2.0").multiply(soGioTangCaNgayLe)))
                    .setScale(0, RoundingMode.HALF_UP);
            bangLuongNhanVien.setOtPremiumPay(tienTangCaMienThue);

            // Bước 5.5: Tính tổng thu nhập Gross
            BigDecimal tongThuNhapGross = luongChinhThucTe.add(phuCapAnTrua)
                    .add(bangLuongNhanVien.getSeniorityAllowance())
                    .add(bangLuongNhanVien.getOtherAllowances())
                    .add(bangLuongNhanVien.getBonus())
                    .add(bangLuongNhanVien.getOtPay())
                    .subtract(bangLuongNhanVien.getPenalty());

            if (tongThuNhapGross.compareTo(BigDecimal.ZERO) < 0)
                tongThuNhapGross = BigDecimal.ZERO;
            bangLuongNhanVien.setGrossIncome(tongThuNhapGross);

            // Bước 5.6: Trích các khoản đóng bảo hiểm xã hội bắt buộc (NLĐ & DN)
            BigDecimal bhxhNhanVien = BigDecimal.ZERO, bhytNhanVien = BigDecimal.ZERO, bhtnNhanVien = BigDecimal.ZERO;
            BigDecimal bhxhCongTy = BigDecimal.ZERO, bhytCongTy = BigDecimal.ZERO, bhtnCongTy = BigDecimal.ZERO,
                    kpcdCongTy = BigDecimal.ZERO;

            if (nhanVien.getEmployeeType() == EmployeeType.FULL_TIME) {
                BigDecimal mucTranBaoHiem = thamSoLuong.getInsuranceCeiling() != null ? thamSoLuong.getInsuranceCeiling()
                        : new BigDecimal("36000000");
                BigDecimal luongDongBaoHiem = luongHopDong.compareTo(mucTranBaoHiem) < 0 ? luongHopDong : mucTranBaoHiem;

                BigDecimal tyLeBhxhNhanVien = cauHinhBaoHiemDaDuyet.getBhxhEmployee() != null
                        ? cauHinhBaoHiemDaDuyet.getBhxhEmployee()
                        : new BigDecimal("8.0");
                BigDecimal tyLeBhytNhanVien = cauHinhBaoHiemDaDuyet.getBhytEmployee() != null
                        ? cauHinhBaoHiemDaDuyet.getBhytEmployee()
                        : new BigDecimal("1.5");
                BigDecimal tyLeBhtnNhanVien = cauHinhBaoHiemDaDuyet.getBhtnEmployee() != null
                        ? cauHinhBaoHiemDaDuyet.getBhtnEmployee()
                        : new BigDecimal("1.0");

                BigDecimal tyLeBhxhCongTy = cauHinhBaoHiemDaDuyet.getBhxhEmployer() != null
                        ? cauHinhBaoHiemDaDuyet.getBhxhEmployer()
                        : new BigDecimal("17.5");
                BigDecimal tyLeBhytCongTy = cauHinhBaoHiemDaDuyet.getBhytEmployer() != null
                        ? cauHinhBaoHiemDaDuyet.getBhytEmployer()
                        : new BigDecimal("3.0");
                BigDecimal tyLeBhtnCongTy = cauHinhBaoHiemDaDuyet.getBhtnEmployer() != null
                        ? cauHinhBaoHiemDaDuyet.getBhtnEmployer()
                        : new BigDecimal("1.0");
                BigDecimal tyLeKpcdCongTy = cauHinhBaoHiemDaDuyet.getKpcdEmployer() != null
                        ? cauHinhBaoHiemDaDuyet.getKpcdEmployer()
                        : new BigDecimal("2.0");

                bhxhNhanVien = luongDongBaoHiem.multiply(tyLeBhxhNhanVien).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhytNhanVien = luongDongBaoHiem.multiply(tyLeBhytNhanVien).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhtnNhanVien = luongDongBaoHiem.multiply(tyLeBhtnNhanVien).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

                bhxhCongTy = luongDongBaoHiem.multiply(tyLeBhxhCongTy).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhytCongTy = luongDongBaoHiem.multiply(tyLeBhytCongTy).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                bhtnCongTy = luongDongBaoHiem.multiply(tyLeBhtnCongTy).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
                kpcdCongTy = luongDongBaoHiem.multiply(tyLeKpcdCongTy).divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
            }

            bangLuongNhanVien.setBhxhNhanVien(bhxhNhanVien);
            bangLuongNhanVien.setBhytNhanVien(bhytNhanVien);
            bangLuongNhanVien.setBhtnNhanVien(bhtnNhanVien);
            bangLuongNhanVien.setTotalInsurance(bhxhNhanVien.add(bhytNhanVien).add(bhtnNhanVien));
            bangLuongNhanVien.setBhxhCongTy(bhxhCongTy);
            bangLuongNhanVien.setBhytCongTy(bhytCongTy);
            bangLuongNhanVien.setBhtnCongTy(bhtnCongTy);
            bangLuongNhanVien.setKpcdCongTy(kpcdCongTy);
            bangLuongNhanVien.setTotalEmployerInsurance(bhxhCongTy.add(bhytCongTy).add(bhtnCongTy).add(kpcdCongTy));

            // Bước 5.7: Tính toán giảm trừ gia cảnh và Thuế thu nhập cá nhân (TNCN)
            BigDecimal giaTriTangCaMienThue = bangLuongNhanVien.getOtPremiumPay() != null ? bangLuongNhanVien.getOtPremiumPay() : BigDecimal.ZERO;
            BigDecimal thuNhapChiuThueCoBan = tongThuNhapGross.subtract(phuCapAnTrua).subtract(giaTriTangCaMienThue);
            BigDecimal giamTruBanThan = khoanGiamTruDaDuyet.getPersonalDeduction() != null
                    ? khoanGiamTruDaDuyet.getPersonalDeduction()
                    : new BigDecimal("11000000");
            BigDecimal giamTruGiaCanh = new BigDecimal(nhanVien.getDependentCount() != null ? nhanVien.getDependentCount() : 0)
                    .multiply(khoanGiamTruDaDuyet.getDependentDeduction() != null
                            ? khoanGiamTruDaDuyet.getDependentDeduction()
                            : new BigDecimal("4400000"));

            BigDecimal thuNhapTinhThue = thuNhapChiuThueCoBan.subtract(giamTruBanThan).subtract(giamTruGiaCanh)
                    .subtract(bangLuongNhanVien.getTotalInsurance())
                    .subtract(bangLuongNhanVien.getCharityDeduction() != null ? bangLuongNhanVien.getCharityDeduction() : BigDecimal.ZERO);

            if (thuNhapTinhThue.compareTo(BigDecimal.ZERO) < 0)
                thuNhapTinhThue = BigDecimal.ZERO;

            bangLuongNhanVien.setTaxableIncomeBase(thuNhapChiuThueCoBan);
            bangLuongNhanVien.setPersonalDeduction(giamTruBanThan);
            bangLuongNhanVien.setDependentDeduction(giamTruGiaCanh);
            bangLuongNhanVien.setDependentCount(nhanVien.getDependentCount() != null ? nhanVien.getDependentCount() : 0);

            EmployeeTaxConfig cauHinhThueNhanVien = banDoCauHinhThue.getOrDefault(nhanVien.getEmployeeType(),
                    new EmployeeTaxConfig(null, nhanVien.getEmployeeType(), TaxMethod.PROGRESSIVE, "APPROVED"));
            BigDecimal tienThueTncn = BigDecimal.ZERO;
            if (cauHinhThueNhanVien.getTaxMethod() == TaxMethod.PROGRESSIVE) {
                tienThueTncn = calculatePITOptimized(thuNhapTinhThue, bacThueDaDuyet);
            } else if (cauHinhThueNhanVien.getTaxMethod() == TaxMethod.FIXED_10
                    && tongThuNhapGross.compareTo(new BigDecimal("2000000")) >= 0) {
                tienThueTncn = tongThuNhapGross.multiply(new BigDecimal("0.1")).setScale(0, RoundingMode.HALF_UP);
            }

            // Bước 5.8: Tính lương thực nhận (Net) và đặt trạng thái nháp (DRAFT)
            bangLuongNhanVien.setTaxableIncome(thuNhapTinhThue);
            bangLuongNhanVien.setTaxAmount(tienThueTncn);
            bangLuongNhanVien.setNetPay(tongThuNhapGross.subtract(bangLuongNhanVien.getTotalInsurance()).subtract(tienThueTncn));
            bangLuongNhanVien.setStatus(PayrollStatus.DRAFT);
            danhSachCanLuu.add(bangLuongNhanVien);
        }
        // Bước 6: Lưu tất cả kết quả tính lương của tháng vào cơ sở dữ liệu
        repoBangLuong.saveAll(danhSachCanLuu);
        System.out.println("Payroll Calculation completed successfully for " + danhSachCanLuu.size() + " records.");
    }

    // Tính toán thuế thu nhập cá nhân (PIT) tối ưu dựa trên biểu thuế lũy tiến từng phần
    private BigDecimal calculatePITOptimized(BigDecimal thuNhap, List<TaxTier> bacThue) {
        if (thuNhap.compareTo(BigDecimal.ZERO) <= 0)
            return BigDecimal.ZERO;
        if (bacThue.isEmpty()) {
            if (thuNhap.compareTo(new BigDecimal("10000000")) <= 0)
                return thuNhap.multiply(new BigDecimal("0.05")).setScale(0, RoundingMode.HALF_UP);
            if (thuNhap.compareTo(new BigDecimal("30000000")) <= 0)
                return thuNhap.multiply(new BigDecimal("0.10")).subtract(new BigDecimal("500000")).setScale(0,
                        RoundingMode.HALF_UP);
            if (thuNhap.compareTo(new BigDecimal("60000000")) <= 0)
                return thuNhap.multiply(new BigDecimal("0.20")).subtract(new BigDecimal("3500000")).setScale(0,
                        RoundingMode.HALF_UP);
            if (thuNhap.compareTo(new BigDecimal("100000000")) <= 0)
                return thuNhap.multiply(new BigDecimal("0.30")).subtract(new BigDecimal("9500000")).setScale(0,
                        RoundingMode.HALF_UP);
            return thuNhap.multiply(new BigDecimal("0.35")).subtract(new BigDecimal("14500000")).setScale(0,
                    RoundingMode.HALF_UP);
        }

        BigDecimal tienThue = BigDecimal.ZERO;
        BigDecimal thuNhapConLai = thuNhap;
        for (TaxTier bac : bacThue) {
            BigDecimal canDuoi = bac.getLowerBound() != null ? bac.getLowerBound() : BigDecimal.ZERO;
            BigDecimal canTren = (bac.getUpperBound() == null || bac.getUpperBound().compareTo(BigDecimal.ZERO) <= 0)
                    ? new BigDecimal("999999999999")
                    : bac.getUpperBound();
            BigDecimal khoangCachBac = canTren.subtract(canDuoi);
            BigDecimal thueSuat = bac.getTaxRate().divide(new BigDecimal("100"), 10, RoundingMode.HALF_UP);

            if (thuNhapConLai.compareTo(khoangCachBac) > 0 && khoangCachBac.compareTo(BigDecimal.ZERO) > 0) {
                tienThue = tienThue.add(khoangCachBac.multiply(thueSuat));
                thuNhapConLai = thuNhapConLai.subtract(khoangCachBac);
            } else {
                tienThue = tienThue.add(thuNhapConLai.multiply(thueSuat));
                break;
            }
        }
        return tienThue.setScale(0, RoundingMode.HALF_UP);
    }

    // Tính số ngày làm việc thực tế (Thứ 2 đến Thứ 6) của tháng và năm chỉ định
    private int calculateBusinessDays(int thang, int nam) {
        LocalDate ngayBatDau = LocalDate.of(nam, thang, 1);
        int soNgayTrongThang = ngayBatDau.lengthOfMonth();
        int soNgayLamViec = 0;
        for (int i = 1; i <= soNgayTrongThang; i++) {
            LocalDate ngay = LocalDate.of(nam, thang, i);
            if (ngay.getDayOfWeek().getValue() < 6) { // T2 -> T6
                soNgayLamViec++;
            }
        }
        return soNgayLamViec;
    }

    // Lấy lương hợp đồng tại một thời điểm chỉ định dựa trên lịch sử biến động lương
    private BigDecimal getContractSalaryAt(Employee nhanVien, LocalDate ngayMucTieu, List<SalaryChange> danhSachDieuChinh) {
        if (danhSachDieuChinh == null || danhSachDieuChinh.isEmpty()) {
            return nhanVien.getContractSalary() != null ? nhanVien.getContractSalary() : BigDecimal.ZERO;
        }

        SalaryChange bienDongMoiNhat = null;
        for (SalaryChange change : danhSachDieuChinh) {
            if (!change.getEffectiveDate().isAfter(ngayMucTieu)) {
                bienDongMoiNhat = change;
            } else {
                // Do danh sách biến động được sắp xếp tăng dần theo ngày hiệu lực,
                // biến động đầu tiên sau ngày ngayMucTieu sẽ cho biết mức lương cũ ngay trước khi có biến động đó.
                if (bienDongMoiNhat == null) {
                    return change.getOldValue() != null ? change.getOldValue() : BigDecimal.ZERO;
                }
                break;
            }
        }

        if (bienDongMoiNhat != null) {
            return bienDongMoiNhat.getNewValue() != null ? bienDongMoiNhat.getNewValue() : BigDecimal.ZERO;
        }

        return nhanVien.getContractSalary() != null ? nhanVien.getContractSalary() : BigDecimal.ZERO;
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
