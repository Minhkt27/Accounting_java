package com.accounting.app.controller;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import java.util.*;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    @Autowired
    private DeductionSettingRepository deductionRepo;
    @Autowired
    private EmployeeRepository employeeRepo;
    @Autowired
    private TaxTierRepository taxRepo;
    @Autowired
    private InsuranceConfigRepository insuranceRepo;
    @Autowired
    private AccountCategoryRepository accountRepo;
    @Autowired
    private EntityManager entityManager;

    @GetMapping("/db-dump")
    public Map<String, Object> dump() {
        Map<String, Object> res = new HashMap<>();
        res.put("taxTiers", taxRepo.findAll());
        res.put("deductions", deductionRepo.findAll());
        res.put("insuranceConfigs", insuranceRepo.findAll());
        res.put("employees", employeeRepo.findAll());
        return res;
    }

    @GetMapping("/fix-departments")
    public String fixDepartments() {
        employeeRepo.findAll().forEach(e -> {
            if (e.getDepartment() == null || e.getDepartment().isEmpty()) {
                if ("NV001".equals(e.getId()))
                    e.setDepartment("Kế toán");
                else if ("NV002".equals(e.getId()))
                    e.setDepartment("Nhân sự");
                else if ("NV003".equals(e.getId()))
                    e.setDepartment("Kỹ thuật");
                else
                    e.setDepartment("Kinh doanh");
                employeeRepo.save(e);
            }
        });
        return "Success: Applied departments to existing employees.";
    }

    @GetMapping("/fix-tax-configs")
    @Transactional
    public Map<String, Object> fixTaxConfigs() {
        Map<String, Object> res = new HashMap<>();
        try {
            // Sử dụng Native Query để tránh lỗi mapping Enum 'TRAINEE' khi JPA list
            // entities
            int deletedTax = entityManager.createNativeQuery(
                    "DELETE FROM employee_tax_configs WHERE employee_type = 'TRAINEE' OR employee_type = 'VOCATIONAL'")
                    .executeUpdate();

            int updatedEmp = entityManager.createNativeQuery(
                    "UPDATE employees SET employee_type = 'OTHER' WHERE employee_type = 'TRAINEE' OR employee_type = 'VOCATIONAL'")
                    .executeUpdate();

            res.put("status", "success");
            res.put("deleted_tax_configs", deletedTax);
            res.put("updated_employees", updatedEmp);
            res.put("message", "Đã dọn dẹp dữ liệu lỗi thời.");
        } catch (Exception e) {
            res.put("status", "error");
            res.put("message", e.getMessage());
        }
        return res;
    }

    @GetMapping("/init-accounts")
    @Transactional
    public Map<String, Object> initAccounts() {
        Map<String, Object> res = new HashMap<>();
        try {
            // Danh sách tài khoản mẫu theo yêu cầu người dùng kèm tên tiếng Anh
            String[][] data = {
                {"111", "Tiền mặt", "DEBIT", null, "Cash"},
                {"1111", "Tiền Việt Nam", "DEBIT", "111", "Vietnamese dong"},
                {"1112", "Tiền ngoại tệ", "DEBIT", "111", "Foreign currency"},
                {"112", "Tiền gửi không kỳ hạn", "DEBIT", null, "Demand deposits"},
                {"113", "Tiền đang chuyển", "DEBIT", null, "Cash in transit"},
                {"333", "Thuế và các khoản phải nộp Nhà nước", "BOTH", null, "Taxes and other payables to the State"},
                {"3331", "Thuế giá trị gia tăng phải nộp", "BOTH", "333", "Value added tax payable"},
                {"3332", "Thuế tiêu thụ đặc biệt", "BOTH", "333", "Special consumption tax"},
                {"3333", "Thuế xuất, nhập khẩu", "BOTH", "333", "Export and import tax"},
                {"3334", "Thuế thu nhập doanh nghiệp", "BOTH", "333", "Corporate income tax"},
                {"3335", "Thuế thu nhập cá nhân", "BOTH", "333", "Personal income tax"},
                {"3336", "Thuế tài nguyên", "BOTH", "333", "Natural resource tax"},
                {"3337", "Thuế nhà đất, tiền thuế đất", "BOTH", "333", "Land and housing tax, land rent"},
                {"334", "Phải trả người lao động", "CREDIT", null, "Payables to employees"},
                {"338", "Phải trả, phải nộp khác", "BOTH", null, "Other payables"},
                {"642", "Chi phí quản lý doanh nghiệp", "BOTH", null, "General and administrative expenses"}
            };

            int count = 0;
            for (String[] row : data) {
                String id = row[0];
                String name = row[1];
                String type = row[2];
                String parentId = row[3];
                String englishName = row[4];

                Optional<AccountCategory> existing = accountRepo.findById(id);
                AccountCategory acc;
                if (existing.isPresent()) {
                    acc = existing.get();
                    acc.setName(name);
                    acc.setType(type);
                    acc.setParentId(parentId);
                    acc.setEnglishName(englishName);
                } else {
                    acc = new AccountCategory(id, name, type, parentId);
                    acc.setEnglishName(englishName);
                    acc.setStatus("APPROVED");
                    count++;
                }
                accountRepo.save(acc);
            }

            res.put("status", "success");
            res.put("added_count", count);
            res.put("message", "Đã khởi tạo danh mục tài khoản.");
        } catch (Exception e) {
            res.put("status", "error");
            res.put("message", e.getMessage());
        }
        return res;
    }
}
