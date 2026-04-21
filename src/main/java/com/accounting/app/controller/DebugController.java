package com.accounting.app.controller;

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
}
