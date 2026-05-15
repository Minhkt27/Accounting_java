package com.accounting.app.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired private RoleRepository roleRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private InsuranceConfigRepository insuranceConfigRepo;
    @Autowired private SalaryParameterRepository salaryRepo;
    @Autowired private TaxTierRepository taxRepo;
    @Autowired private DeductionSettingRepository deductionRepo;
    @Autowired private EmployeeRepository employeeRepo;
    @Autowired private AccountCategoryRepository accountRepo;
    @Autowired private RolePermissionRepository permRepo;
    @Autowired private EmployeeTaxConfigRepository taxConfigRepo;
    @Autowired private PasswordEncoder encoder;

    @jakarta.transaction.Transactional
    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting Data Seeding Process...");
        
        // Seed UC 01: Account Categories (Standard Accounting)
        if (accountRepo.count() == 0) {
            accountRepo.save(new AccountCategory("642", "Chi phí quản lý doanh nghiệp", "Nợ"));
            accountRepo.save(new AccountCategory("334", "Phải trả người lao động", "Có"));
            accountRepo.save(new AccountCategory("111", "Tiền mặt", "Có"));
            accountRepo.save(new AccountCategory("112", "Tiền gửi ngân hàng", "Có"));
            accountRepo.save(new AccountCategory("338", "Phải trả, phải nộp khác (BH)", "Có"));
            accountRepo.save(new AccountCategory("3335", "Thuế TNCN phải nộp", "Có"));
            
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
        seedUser("ketoan_tien", "kttien@company.com", "123456", ERole.ROLE_KE_TOAN_VON_BANG_TIEN);
        seedUser("ketoan_truong", "kttruong@company.com", "123456", ERole.ROLE_KE_TOAN_TRUONG);

        // Seed ma trận phân quyền mặc định
        permRepo.deleteByRoleName("ROLE_KE_TOAN_LUONG");
        permRepo.deleteByRoleName("ROLE_KE_TOAN_VON_BANG_TIEN");
        permRepo.deleteByRoleName("ROLE_KE_TOAN_TRUONG");
        permRepo.deleteByRoleName("ROLE_NHAN_SU");

        seedPerm("ROLE_NHAN_SU", "HR_EMPLOYEE"); seedPerm("ROLE_NHAN_SU", "HR_ATTENDANCE"); seedPerm("ROLE_NHAN_SU", "HR_LEAVE");
        seedPerm("ROLE_NHAN_SU", "HR_SALARY_CHANGE");
        seedPerm("ROLE_NHAN_SU", "HR_SALARY_CHANGE_APPROVE");

        seedPerm("ROLE_KE_TOAN_LUONG", "CONFIG_ACCOUNT"); seedPerm("ROLE_KE_TOAN_LUONG", "CONFIG_INSURANCE");
        seedPerm("ROLE_KE_TOAN_LUONG", "PAYROLL_CALCULATE"); seedPerm("ROLE_KE_TOAN_LUONG", "ACCOUNTING_VIEW");

        seedPerm("ROLE_KE_TOAN_VON_BANG_TIEN", "PAYROLL_PAY");
        seedPerm("ROLE_KE_TOAN_VON_BANG_TIEN", "ACCOUNTING_VIEW");

        seedPerm("ROLE_KE_TOAN_TRUONG", "CONFIG_ACCOUNT"); 
        seedPerm("ROLE_KE_TOAN_TRUONG", "CONFIG_INSURANCE"); 
        seedPerm("ROLE_KE_TOAN_TRUONG", "PAYROLL_CALCULATE"); 
        seedPerm("ROLE_KE_TOAN_TRUONG", "PAYROLL_APPROVE"); 
        seedPerm("ROLE_KE_TOAN_TRUONG", "ACCOUNTING_VIEW");
        seedPerm("ROLE_KE_TOAN_TRUONG", "HR_SALARY_CHANGE_APPROVE");
        seedPerm("ROLE_KE_TOAN_TRUONG", "DASHBOARD_VIEW");

        // Update status for existing null records
        salaryRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); salaryRepo.save(x); });
        insuranceConfigRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); insuranceConfigRepo.save(x); });
        taxRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); taxRepo.save(x); });
        deductionRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); deductionRepo.save(x); });

        // Seed UC 02: Insurance Config (Unified)
        if (insuranceConfigRepo.count() == 0) {
            InsuranceConfig config = new InsuranceConfig();
            config.setBhxhEmployee(new BigDecimal("8.0")); config.setBhytEmployee(new BigDecimal("1.5")); config.setBhtnEmployee(new BigDecimal("1.0"));
            config.setBhxhEmployer(new BigDecimal("17.5")); config.setBhytEmployer(new BigDecimal("3.0")); config.setBhtnEmployer(new BigDecimal("1.0"));
            config.setKpcdEmployer(new BigDecimal("2.0"));
            config.setEffectiveDate(LocalDate.now());
            config.setStatus("APPROVED");
            insuranceConfigRepo.save(config);
            System.out.println("Seeded Unified Insurance Configuration");
        }

        // Seed UC 03: Salary Params
        if (salaryRepo.count() == 0) {
            SalaryParameter p = new SalaryParameter();
            p.setStandardWorkDays(new BigDecimal("26.0"));
            p.setStandardWorkDayMode("FIXED");
            p.setMinimumWage(new BigDecimal("1800000"));
            p.setBaseSalary(new BigDecimal("1800000"));
            p.setInsuranceCeiling(new BigDecimal("36000000"));
            p.setMealAllowance(new BigDecimal("25000"));
            p.setStatus("APPROVED");
            salaryRepo.save(p);
        }

        // Seed UC 04/05: Tax Tiers
        if (taxRepo.count() == 0) {
            taxRepo.saveAll((Iterable<TaxTier>) List.of(
                createTier(new BigDecimal("0.0"), new BigDecimal("5000000"), new BigDecimal("5.0"), 1),
                createTier(new BigDecimal("5000000"), new BigDecimal("10000000"), new BigDecimal("10.0"), 2),
                createTier(new BigDecimal("10000000"), new BigDecimal("18000000"), new BigDecimal("15.0"), 3),
                createTier(new BigDecimal("18000000"), new BigDecimal("32000000"), new BigDecimal("20.0"), 4),
                createTier(new BigDecimal("32000000"), BigDecimal.ZERO, new BigDecimal("25.0"), 5)
            ));
        }

        // Seed UC 06: Deductions
        if (deductionRepo.count() == 0) {
            DeductionSetting d = new DeductionSetting();
            d.setPersonalDeduction(new BigDecimal("11000000"));
            d.setDependentDeduction(new BigDecimal("4400000"));
            d.setStatus("APPROVED");
            deductionRepo.save(d);
        }

        // Seed UC: Employee Tax Rules (New section requested)
        if (taxConfigRepo.count() == 0) {
            taxConfigRepo.save(new EmployeeTaxConfig(null, EmployeeType.FULL_TIME, TaxMethod.PROGRESSIVE, "APPROVED"));
            taxConfigRepo.save(new EmployeeTaxConfig(null, EmployeeType.INTERN, TaxMethod.FIXED_10, "APPROVED"));
            taxConfigRepo.save(new EmployeeTaxConfig(null, EmployeeType.OTHER, TaxMethod.EXEMPT, "APPROVED"));
            System.out.println("Seeded Default Employee Tax Rules");
        }

        // Seed Nhóm 2: Test Employees
        if (employeeRepo.count() == 0) {
            Employee e1 = new Employee("NV001", "Nguyễn Văn Anh", new BigDecimal("25000000"), 1, EmployeeType.FULL_TIME);
            e1.setDob(LocalDate.of(1990, 5, 20));
            e1.setPhone("0912345678");
            e1.setEmail("anhnv@company.com");
            e1.setHometown("Hà Nội");
            e1.setPositionCoefficient(new BigDecimal("0.8"));
            e1.setSeniorityAllowance(new BigDecimal("500000"));
            e1.setDepartment("Kế toán");
            e1.setJoinDate(LocalDate.of(2026, 1, 1));
            e1.setActive(true);
            employeeRepo.save(e1);

            Employee e2 = new Employee("NV002", "Trần Thị Bình", new BigDecimal("12000000"), 0, EmployeeType.PROBATION);
            e2.setDob(LocalDate.of(1995, 10, 15));
            e2.setPhone("0987654321");
            e2.setEmail("binhtt@company.com");
            e2.setHometown("Hải Phòng");
            e2.setPositionCoefficient(new BigDecimal("0.4"));
            e2.setSeniorityAllowance(BigDecimal.ZERO);
            e2.setDepartment("Nhân sự");
            e2.setJoinDate(LocalDate.of(2026, 1, 1));
            e2.setActive(true);
            employeeRepo.save(e2);

            Employee e3 = new Employee("NV003", "Lê Văn Cường", new BigDecimal("5000000"), 0, EmployeeType.INTERN);
            e3.setDob(LocalDate.of(2002, 1, 1));
            e3.setPhone("0901234567");
            e3.setEmail("cuonglv@company.com");
            e3.setHometown("Đà Nẵng");
            e3.setDepartment("Kinh doanh");
            e3.setJoinDate(LocalDate.of(2026, 1, 1));
            e3.setActive(true);
            employeeRepo.save(e3);
        }
        System.out.println(">>> Data Seeding Process Finished Successfully <<<");
    }

    private TaxTier createTier(BigDecimal lower, BigDecimal upper, BigDecimal rate, Integer level) {
        TaxTier t = new TaxTier();
        t.setLowerBound(lower); t.setUpperBound(upper);
        t.setLowerBoundYearly(lower.multiply(new BigDecimal("12")));
        t.setUpperBoundYearly(upper.multiply(new BigDecimal("12")));
        t.setTaxRate(rate); t.setTierLevel(level);
        t.setStatus("APPROVED");
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
