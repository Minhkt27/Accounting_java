package com.accounting.app.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
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
        insuranceRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); insuranceRepo.save(x); });
        taxRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); taxRepo.save(x); });
        deductionRepo.findAll().stream().filter(x -> x.getStatus() == null).forEach(x -> { x.setStatus("APPROVED"); deductionRepo.save(x); });

        // Seed UC 02: Insurance Rates
        if (insuranceRepo.count() == 0) {
            InsuranceRate xh = new InsuranceRate();
            xh.setType("XH"); xh.setEmployeeRate(8.0); xh.setEmployerRate(17.5); xh.setEffectiveDate(LocalDate.now()); xh.setStatus("APPROVED");
            insuranceRepo.save(xh);

            InsuranceRate yt = new InsuranceRate();
            yt.setType("YT"); yt.setEmployeeRate(1.5); yt.setEmployerRate(3.0); yt.setEffectiveDate(LocalDate.now()); yt.setStatus("APPROVED");
            insuranceRepo.save(yt);

            InsuranceRate tn = new InsuranceRate();
            tn.setType("TN"); tn.setEmployeeRate(1.0); tn.setEmployerRate(1.0); tn.setEffectiveDate(LocalDate.now()); tn.setStatus("APPROVED");
            insuranceRepo.save(tn);
        }

        // Seed UC 03: Salary Params
        if (salaryRepo.count() == 0) {
            SalaryParameter p = new SalaryParameter();
            p.setStandardWorkDays(26.0);
            p.setStandardWorkDayMode("FIXED");
            p.setMinimumWage(1800000.0);
            p.setBaseSalary(1800000.0);
            p.setInsuranceCeiling(36000000.0);
            p.setMealAllowance(25000.0);
            p.setStatus("APPROVED");
            salaryRepo.save(p);
        }

        // Seed UC 04/05: Tax Tiers
        if (taxRepo.count() == 0) {
            taxRepo.saveAll((Iterable<TaxTier>) List.of(
                createTier(0.0, 5000000.0, 5.0, 1),
                createTier(5000000.0, 10000000.0, 10.0, 2),
                createTier(10000000.0, 18000000.0, 15.0, 3),
                createTier(18000000.0, 32000000.0, 20.0, 4),
                createTier(32000000.0, 0.0, 25.0, 5)
            ));
        }

        // Seed UC 06: Deductions
        if (deductionRepo.count() == 0) {
            DeductionSetting d = new DeductionSetting();
            d.setPersonalDeduction(11000000.0);
            d.setDependentDeduction(4400000.0);
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
            Employee e1 = new Employee("NV001", "Nguyễn Văn Anh", 25000000.0, 1, EmployeeType.FULL_TIME);
            e1.setDob(LocalDate.of(1990, 5, 20));
            e1.setPositionCoefficient(0.8);
            e1.setSeniorityAllowance(500000.0);
            e1.setDepartment("Kế toán");
            e1.setActive(true);
            employeeRepo.save(e1);

            Employee e2 = new Employee("NV002", "Trần Thị Bình", 12000000.0, 0, EmployeeType.PROBATION);
            e2.setDob(LocalDate.of(1995, 10, 15));
            e2.setPositionCoefficient(0.4);
            e2.setSeniorityAllowance(0.0);
            e2.setDepartment("Nhân sự");
            e2.setActive(true);
            employeeRepo.save(e2);

            Employee e3 = new Employee("NV003", "Lê Văn Cường", 5000000.0, 0, EmployeeType.INTERN);
            e3.setDob(LocalDate.of(2002, 1, 1));
            e3.setDepartment("Kinh doanh");
            e3.setActive(true);
            employeeRepo.save(e3);
        }
        System.out.println(">>> Data Seeding Process Finished Successfully <<<");
    }

    private TaxTier createTier(Double lower, Double upper, Double rate, Integer level) {
        TaxTier t = new TaxTier();
        t.setLowerBound(lower); t.setUpperBound(upper);
        t.setLowerBoundYearly(lower * 12);
        t.setUpperBoundYearly(upper * 12);
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
