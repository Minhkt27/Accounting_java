package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import java.math.BigDecimal;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/config")
public class SystemConfigController {

    @Autowired
    private SalaryParameterRepository salaryRepo;
    @Autowired
    private TaxTierRepository taxRepo;
    @Autowired
    private DeductionSettingRepository deductionRepo;
    @Autowired
    private EmployeeTaxConfigRepository taxConfigRepo;
    @Autowired
    private InsuranceConfigRepository insuranceConfigRepo;

    @GetMapping("/all")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE') or @perm.check('PAYROLL_CALCULATE')")
    public com.accounting.app.dto.ConfigResponse getAllConfigs() {
        return new com.accounting.app.dto.ConfigResponse(
                salaryRepo.findAll(),
                insuranceConfigRepo.findAll(),
                taxRepo.findAllByOrderByTierLevelAsc(),
                deductionRepo.findAll(),
                taxConfigRepo.findAll());
    }

    // NEW: Unified Insurance Config
    @GetMapping("/insurance-config")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<InsuranceConfig> getInsuranceConfig() {
        return insuranceConfigRepo.findAll();
    }

    @PostMapping("/insurance-config")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public InsuranceConfig saveInsuranceConfig(@RequestBody InsuranceConfig config) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String status = (isAdmin || isChief) ? "APPROVED" : "PENDING";
        config.setStatus(status);

        // Delete existing of same status
        List<InsuranceConfig> existing = insuranceConfigRepo.findAll().stream()
                .filter(c -> status.equals(c.getStatus())).toList();
        insuranceConfigRepo.deleteAll(existing);

        config.setId(null);
        return insuranceConfigRepo.save(config);
    }

    @PostMapping("/insurance-config/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public InsuranceConfig approveInsuranceConfig(@PathVariable Long id) {
        InsuranceConfig config = insuranceConfigRepo.findById(id).orElseThrow();
        // Clear all APPROVED
        List<InsuranceConfig> oldApproved = insuranceConfigRepo.findAll().stream()
                .filter(c -> "APPROVED".equals(c.getStatus())).toList();
        insuranceConfigRepo.deleteAll(oldApproved);

        config.setStatus("APPROVED");
        return insuranceConfigRepo.save(config);
    }

    @PostMapping("/insurance-config/{id}/reject")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public void rejectInsuranceConfig(@PathVariable Long id) {
        InsuranceConfig config = insuranceConfigRepo.findById(id).orElseThrow();
        if ("PENDING".equals(config.getStatus())) {
            insuranceConfigRepo.delete(config);
        }
    }

    // UC 03: Salary Params
    @GetMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE') or @perm.check('HR_ATTENDANCE') or @perm.check('PAYROLL_CALCULATE')")
    public List<SalaryParameter> getParams() {
        return salaryRepo.findAll();
    }

    @PostMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public SalaryParameter saveParam(@RequestBody SalaryParameter param) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String status = (isAdmin || isChief) ? "APPROVED" : "PENDING";
        param.setStatus(status);

        // Luôn đảm bảo chỉ có tối đa 1 bản ghi cho mỗi trạng thái
        List<SalaryParameter> existing = salaryRepo.findAll().stream()
                .filter(p -> status.equals(p.getStatus())).toList();
        salaryRepo.deleteAll(existing);

        // Reset ID để luôn là bản ghi mới (overwrite)
        param.setId(null);

        return salaryRepo.save(param);
    }

    @PostMapping("/params/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("null")
    public SalaryParameter approveParam(@PathVariable Long id) {
        SalaryParameter param = salaryRepo.findById(id).orElseThrow();
        // Xóa tất cả các bản APPROVED cũ để chỉ giữ 1 bản duy nhất
        List<SalaryParameter> oldApproved = salaryRepo.findAll().stream()
                .filter(p -> "APPROVED".equals(p.getStatus())).toList();
        salaryRepo.deleteAll(oldApproved);

        param.setStatus("APPROVED");
        return salaryRepo.save(param);
    }

    @PostMapping("/params/{id}/reject")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("null")
    public void rejectParam(@PathVariable Long id) {
        SalaryParameter param = salaryRepo.findById(id).orElseThrow();
        if ("PENDING".equals(param.getStatus())) {
            salaryRepo.delete(param);
        }
    }

    // UC 04, 05: Tax Tiers
    @GetMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> getTaxTiers() {
        return taxRepo.findAllByOrderByTierLevelAsc();
    }

    @PostMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> saveTaxTiers(@RequestBody List<TaxTier> tiers) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String status = (isAdmin || isChief) ? "APPROVED" : "PENDING";

        // Nếu là APPROVED thì mới xóa cũ. Nếu là PENDING thì chỉ thêm mới các bản ghi
        // PENDING?
        // Đơn giản hơn: Nếu là PENDING, ta đánh dấu tất cả tiers mới này là PENDING.
        // Khi duyệt, ta sẽ xóa tất cả APPROVED cũ và chuyển tất cả PENDING thành
        // APPROVED.

        for (TaxTier tier : tiers) {
            tier.setStatus(status);
            // Luôn reset ID để tránh xung đột khi thay thế bộ thuế mới
            tier.setId(null);

            // Tự động tính toán giá trị năm nếu thiếu
            if (tier.getLowerBound() != null && tier.getLowerBoundYearly() == null) {
                tier.setLowerBoundYearly(tier.getLowerBound().multiply(new BigDecimal("12")));
            }
            if (tier.getUpperBound() != null && tier.getUpperBoundYearly() == null) {
                tier.setUpperBoundYearly(tier.getUpperBound().multiply(new BigDecimal("12")));
            }
        }

        if ("APPROVED".equals(status)) {
            taxRepo.deleteAll();
        } else {
            // Xóa các PENDING cũ trước khi lưu bộ PENDING mới
            List<TaxTier> oldPending = taxRepo.findAll().stream().filter(t -> "PENDING".equals(t.getStatus())).toList();
            taxRepo.deleteAll(oldPending);
        }

        return taxRepo.saveAll((Iterable<TaxTier>) tiers);
    }

    @PostMapping("/tax/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> approveTax() {
        // Xóa tất cả APPROVED cũ
        List<TaxTier> oldApproved = taxRepo.findAll().stream().filter(t -> "APPROVED".equals(t.getStatus())).toList();
        taxRepo.deleteAll(oldApproved);

        // Chuyển tất cả PENDING thành APPROVED
        List<TaxTier> pending = taxRepo.findAll().stream().filter(t -> "PENDING".equals(t.getStatus())).toList();
        for (TaxTier t : pending) {
            t.setStatus("APPROVED");
        }
        return taxRepo.saveAll((Iterable<TaxTier>) pending);
    }

    @PostMapping("/tax/reject")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public void rejectTax() {
        List<TaxTier> pending = taxRepo.findAll().stream().filter(t -> "PENDING".equals(t.getStatus())).toList();
        taxRepo.deleteAll(pending);
    }

    // UC 06: Deductions
    @GetMapping("/deductions")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<DeductionSetting> getDeductions() {
        return deductionRepo.findAll();
    }

    @PostMapping("/deductions")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public DeductionSetting saveDeduction(@RequestBody DeductionSetting setting) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin || isChief) {
            setting.setStatus("APPROVED");
        } else {
            setting.setStatus("PENDING");
            setting.setId(null); // Tạo bản ghi nháp mới, không ghi đè Approved
        }
        return deductionRepo.save(setting);
    }

    @PostMapping("/deductions/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("null")
    public DeductionSetting approveDeduction(@PathVariable Long id) {
        DeductionSetting setting = deductionRepo.findById(id).orElseThrow();
        // Xóa tất cả các bản APPROVED cũ
        List<DeductionSetting> oldApproved = deductionRepo.findAll().stream()
                .filter(d -> "APPROVED".equals(d.getStatus())).toList();
        deductionRepo.deleteAll(oldApproved);

        setting.setStatus("APPROVED");
        return deductionRepo.save(setting);
    }

    @PostMapping("/deductions/{id}/reject")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("null")
    public void rejectDeduction(@PathVariable Long id) {
        DeductionSetting setting = deductionRepo.findById(id).orElseThrow();
        if ("PENDING".equals(setting.getStatus())) {
            deductionRepo.delete(setting);
        }
    }

    // New: Employee Tax Config (Radio button rules)
    @GetMapping("/tax-rules")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<EmployeeTaxConfig> getTaxRules() {
        return taxConfigRepo.findAll();
    }

    @PostMapping("/tax-rules")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("unchecked")
    public List<EmployeeTaxConfig> saveTaxRules(@RequestBody List<EmployeeTaxConfig> rules) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String status = (isAdmin || isChief) ? "APPROVED" : "PENDING";

        for (EmployeeTaxConfig rule : rules) {
            rule.setStatus(status);
            rule.setId(null); // Reset ID to null to allow database IDENTITY generation
        }

        if ("APPROVED".equals(status)) {
            taxConfigRepo.deleteAll();
        } else {
            List<EmployeeTaxConfig> oldPending = taxConfigRepo.findAll().stream()
                    .filter(r -> "PENDING".equals(r.getStatus())).toList();
            taxConfigRepo.deleteAll(oldPending);
        }

        return taxConfigRepo.saveAll((Iterable<EmployeeTaxConfig>) rules);
    }

    @PostMapping("/tax-rules/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    @SuppressWarnings("unchecked")
    public List<EmployeeTaxConfig> approveTaxRules() {
        // Clear all APPROVED
        List<EmployeeTaxConfig> oldApproved = taxConfigRepo.findAll().stream()
                .filter(r -> "APPROVED".equals(r.getStatus())).toList();
        taxConfigRepo.deleteAll(oldApproved);

        // Approve all PENDING
        List<EmployeeTaxConfig> pending = taxConfigRepo.findAll().stream().filter(r -> "PENDING".equals(r.getStatus()))
                .toList();
        for (EmployeeTaxConfig r : pending) {
            r.setStatus("APPROVED");
        }
        return taxConfigRepo.saveAll((Iterable<EmployeeTaxConfig>) pending);
    }
}
