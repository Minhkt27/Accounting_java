package com.accounting.app.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private InsuranceRateRepository insuranceRepo;
    @Autowired private SalaryParameterRepository salaryRepo;
    @Autowired private TaxTierRepository taxRepo;
    @Autowired private DeductionSettingRepository deductionRepo;
    @Autowired private EmployeeRepository employeeRepo;
    @Autowired private AccountCategoryRepository accountRepo;
    @Autowired private RolePermissionRepository permRepo;
    @Autowired private PasswordEncoder encoder;

    @jakarta.transaction.Transactional
    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting Data Seeding Process...");
        
        // Seed UC 01: Account Categories (Standard Accounting)
        if (accountRepo.count() == 0) {
            accountRepo.save(new AccountCategory("642", "Chi phí quản lý doanh nghiệp", "DEBIT"));
            accountRepo.save(new AccountCategory("334", "Phải trả người lao động", "CREDIT"));
            accountRepo.save(new AccountCategory("111", "Tiền mặt", "CREDIT"));
            accountRepo.save(new AccountCategory("112", "Tiền gửi ngân hàng", "CREDIT"));
            accountRepo.save(new AccountCategory("338", "Phải trả, phải nộp khác (BH)", "CREDIT"));
            accountRepo.save(new AccountCategory("3335", "Thuế TNCN phải nộp", "CREDIT"));
            
            // Tự động approve các tài khoản mẫu
            accountRepo.findAll().forEach(a -> a.setStatus("APPROVED"));
            accountRepo.saveAll(accountRepo.findAll());
            System.out.println("Seeded 6 Standard Account Categories");
        }

        // Khởi tạo toàn bộ các Quyền (Roles) mặc định theo Đặc tả nghiệp vụ
        for (ERole eRole : ERole.values()) {
            if (roleRepository.findByName(eRole).isEmpty()) {
                roleRepository.save(new Role(eRole));
                System.out.println("Seeded Role: " + eRole.name());
            }
        }

        // Tạo tài khoản Admin mặc định để chuyên gia có thể đăng nhập
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "admin@accounting.com", encoder.encode("admin123"));
            Set<Role> roles = new HashSet<>();
            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(adminRole);
            admin.setRoles(roles);
            userRepository.save(admin);
        }

        // Tạo tài khoản mẫu cho từng phòng ban theo UC.md
        seedUser("nhansu", "nhansu@company.com", "123456", ERole.ROLE_NHAN_SU);
        seedUser("ketoan_luong", "ktluong@company.com", "123456", ERole.ROLE_KE_TOAN_LUONG);
        seedUser("ketoan_truong", "kttruong@company.com", "123456", ERole.ROLE_KE_TOAN_TRUONG);

        // Xóa tài khoản 'ketoan_tt' nếu nó từng tồn tại để tránh xung đột với Enum bị xóa
        userRepository.findByUsername("ketoan_tt").ifPresent(user -> {
            userRepository.delete(user);
            System.out.println("Cleaned up user: ketoan_tt");
        });

        // Seed ma trận phân quyền mặc định
        if (permRepo.count() == 0) {
            // ROLE_NHAN_SU: Nhân sự, Chấm công, Nghỉ phép, Biến động lương
            seedPerm("ROLE_NHAN_SU", "HR_EMPLOYEE"); seedPerm("ROLE_NHAN_SU", "HR_ATTENDANCE"); seedPerm("ROLE_NHAN_SU", "HR_LEAVE");
            seedPerm("ROLE_NHAN_SU", "HR_SALARY_CHANGE");
            // ROLE_KE_TOAN_LUONG: Cấu hình, Chấm công, Tính lương, Sổ kế toán, Biến động lương
            seedPerm("ROLE_KE_TOAN_LUONG", "CONFIG_ACCOUNT"); seedPerm("ROLE_KE_TOAN_LUONG", "CONFIG_INSURANCE");
            seedPerm("ROLE_KE_TOAN_LUONG", "HR_EMPLOYEE"); seedPerm("ROLE_KE_TOAN_LUONG", "HR_ATTENDANCE");
            seedPerm("ROLE_KE_TOAN_LUONG", "PAYROLL_CALCULATE"); seedPerm("ROLE_KE_TOAN_LUONG", "ACCOUNTING_VIEW");
            seedPerm("ROLE_KE_TOAN_LUONG", "HR_SALARY_CHANGE");
            seedPerm("ROLE_KE_TOAN_TRUONG", "CONFIG_ACCOUNT"); 
            seedPerm("ROLE_KE_TOAN_TRUONG", "PAYROLL_APPROVE"); 
            seedPerm("ROLE_KE_TOAN_TRUONG", "ACCOUNTING_VIEW");
            seedPerm("ROLE_KE_TOAN_TRUONG", "HR_SALARY_CHANGE_APPROVE"); 
            seedPerm("ROLE_KE_TOAN_TRUONG", "HR_SALARY_CHANGE");
            System.out.println("Seeded Default Permission Matrix");
        }
        // Seed UC 02: Insurance Rates
        if (insuranceRepo.count() == 0) {
            insuranceRepo.save(new InsuranceRate(null, "XH", 8.0, 17.5, LocalDate.now()));
            insuranceRepo.save(new InsuranceRate(null, "YT", 1.5, 3.0, LocalDate.now()));
            insuranceRepo.save(new InsuranceRate(null, "TN", 1.0, 1.0, LocalDate.now()));
        }

        // Seed UC 03: Salary Params
        if (salaryRepo.count() == 0) {
            SalaryParameter p = new SalaryParameter();
            p.setStandardWorkDays(26.0);
            p.setStandardWorkDayMode("FIXED");
            p.setMinimumWage(1800000.0);
            p.setMealAllowance(25000.0);
            salaryRepo.save(p);
        }

        // Seed UC 04/05: Tax Tiers — 7 bậc theo Luật Thuế TNCN Việt Nam
        if (taxRepo.count() == 0) {
            taxRepo.saveAll(Arrays.asList(
                createTier(0.0, 5000000.0, 5.0, 1),
                createTier(5000000.0, 10000000.0, 10.0, 2),
                createTier(10000000.0, 18000000.0, 15.0, 3),
                createTier(18000000.0, 32000000.0, 20.0, 4),
                createTier(32000000.0, 52000000.0, 25.0, 5),
                createTier(52000000.0, 80000000.0, 30.0, 6),
                createTier(80000000.0, 999999999.0, 35.0, 7)
            ));
        }

        // Seed UC 06: Deductions
        if (deductionRepo.count() == 0) {
            DeductionSetting d = new DeductionSetting();
            d.setPersonalDeduction(15500000.0);
            d.setDependentDeduction(6200000.0);
            deductionRepo.save(d);
        }

        // Seed Nhóm 2: Test Employees với thông tin chi tiết mới
        try {
            if (employeeRepo.count() == 0) {
                Employee e1 = new Employee("NV001", "Nguyễn Văn Anh", 25000000.0, 1, EmployeeType.FULL_TIME);
                e1.setDob(LocalDate.of(1990, 5, 20));
                e1.setPhone("0912345678");
                e1.setEmail("anh.nv@company.com");
                e1.setHometown("Hà Nội");
                e1.setPositionCoefficient(0.8); // Giám đốc
                e1.setSeniorityAllowance(500000.0);
                employeeRepo.save(e1);

                Employee e2 = new Employee("NV002", "Trần Thị Bình", 12000000.0, 0, EmployeeType.PROBATION);
                e2.setDob(LocalDate.of(1995, 10, 15));
                e2.setPhone("0987654321");
                e2.setEmail("binh.tt@company.com");
                e2.setHometown("Nam Định");
                e2.setPositionCoefficient(0.4); // Trưởng phòng
                e2.setSeniorityAllowance(0.0);
                employeeRepo.save(e2);

                Employee e3 = new Employee("NV003", "Lê Văn Cường", 5000000.0, 0, EmployeeType.INTERN);
                e3.setDob(LocalDate.of(2002, 1, 1));
                e3.setPhone("0905556667");
                e3.setEmail("cuong.lv@company.com");
                e3.setHometown("Hải Phòng");
                employeeRepo.save(e3);
                
                System.out.println("Seeded 3 Detailed Test Employees with Allowances");
            }
        } catch (Exception e) {
            System.err.println("Error seeding employees: " + e.getMessage());
        }
        System.out.println(">>> Data Seeding Process Finished Successfully <<<");
    }

    private TaxTier createTier(Double lower, Double upper, Double rate, Integer level) {
        TaxTier t = new TaxTier();
        t.setLowerBound(lower); t.setUpperBound(upper); t.setTaxRate(rate); t.setTierLevel(level);
        return t;
    }

    private void seedUser(String username, String email, String password, ERole eRole) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User(username, email, encoder.encode(password));
            Set<Role> roles = new HashSet<>();
            roleRepository.findByName(eRole).ifPresent(roles::add);
            user.setRoles(roles);
            userRepository.save(user);
            System.out.println("Seeded User: " + username + " [" + eRole.name() + "]");
        }
    }

    private void seedPerm(String roleName, String functionCode) {
        if (!permRepo.existsByRoleNameAndFunctionCode(roleName, functionCode)) {
            permRepo.save(new RolePermission(roleName, functionCode, true));
        }
    }
}
