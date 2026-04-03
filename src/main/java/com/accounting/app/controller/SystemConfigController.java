package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/config")
public class SystemConfigController {

    @Autowired private InsuranceRateRepository insuranceRepo;
    @Autowired private SalaryParameterRepository salaryRepo;
    @Autowired private TaxTierRepository taxRepo;
    @Autowired private DeductionSettingRepository deductionRepo;

    // UC 02: Insurance
    @GetMapping("/insurance")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<InsuranceRate> getInsurance() { return insuranceRepo.findAll(); }

    @PostMapping("/insurance")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public InsuranceRate saveInsurance(@RequestBody InsuranceRate rate) { 
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin || isChief) {
            rate.setStatus("APPROVED");
        } else {
            rate.setStatus("PENDING");
        }
        return insuranceRepo.save(rate); 
    }

    @PostMapping("/insurance/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public InsuranceRate approveInsurance(@PathVariable Long id) {
        InsuranceRate rate = insuranceRepo.findById(id).orElseThrow();
        // Không xóa bảo hiểm cũ vì có thể có nhiều loại (BHXH, BHYT...)
        rate.setStatus("APPROVED");
        return insuranceRepo.save(rate);
    }

    @PostMapping("/insurance/{id}/reject")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public void rejectInsurance(@PathVariable Long id) {
        InsuranceRate rate = insuranceRepo.findById(id).orElseThrow();
        if ("PENDING".equals(rate.getStatus())) {
            insuranceRepo.delete(rate);
        }
    }

    @PutMapping("/insurance/{id}")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public InsuranceRate updateInsurance(@PathVariable Long id, @RequestBody InsuranceRate rate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        InsuranceRate existing = insuranceRepo.findById(id).orElseThrow();
        existing.setType(rate.getType());
        existing.setEmployeeRate(rate.getEmployeeRate());
        existing.setEmployerRate(rate.getEmployerRate());
        existing.setEffectiveDate(rate.getEffectiveDate());

        if (isAdmin || isChief) {
            existing.setStatus("APPROVED");
        } else {
            existing.setStatus("PENDING");
        }
        return insuranceRepo.save(existing);
    }

    @DeleteMapping("/insurance/{id}")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public void deleteInsurance(@PathVariable Long id) {
        insuranceRepo.deleteById(id);
    }

    // UC 03: Salary Params
    @GetMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<SalaryParameter> getParams() { return salaryRepo.findAll(); }

    @PostMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public SalaryParameter saveParam(@RequestBody SalaryParameter param) { 
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin || isChief) {
            param.setStatus("APPROVED");
        } else {
            param.setStatus("PENDING");
        }
        return salaryRepo.save(param); 
    }

    @PostMapping("/params/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
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
    public void rejectParam(@PathVariable Long id) {
        SalaryParameter param = salaryRepo.findById(id).orElseThrow();
        if ("PENDING".equals(param.getStatus())) {
            salaryRepo.delete(param);
        }
    }

    // UC 04, 05: Tax Tiers
    @GetMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> getTaxTiers() { return taxRepo.findAllByOrderByTierLevelAsc(); }

    @PostMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> saveTaxTiers(@RequestBody List<TaxTier> tiers) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isChief = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        String status = (isAdmin || isChief) ? "APPROVED" : "PENDING";
        
        // Nếu là APPROVED thì mới xóa cũ. Nếu là PENDING thì chỉ thêm mới các bản ghi PENDING? 
        // Đơn giản hơn: Nếu là PENDING, ta đánh dấu tất cả tiers mới này là PENDING.
        // Khi duyệt, ta sẽ xóa tất cả APPROVED cũ và chuyển tất cả PENDING thành APPROVED.
        
        for (TaxTier tier : tiers) {
            tier.setStatus(status);
        }
        
        if ("APPROVED".equals(status)) {
            taxRepo.deleteAll();
        } else {
            // Xóa các PENDING cũ trước khi lưu PENDING mới
            List<TaxTier> oldPending = taxRepo.findAll().stream().filter(t -> "PENDING".equals(t.getStatus())).toList();
            taxRepo.deleteAll(oldPending);
        }
        
        return taxRepo.saveAll(tiers);
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
        return taxRepo.saveAll(pending);
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
    public List<DeductionSetting> getDeductions() { return deductionRepo.findAll(); }

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
        }
        return deductionRepo.save(setting); 
    }

    @PostMapping("/deductions/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
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
    public void rejectDeduction(@PathVariable Long id) {
        DeductionSetting setting = deductionRepo.findById(id).orElseThrow();
        if ("PENDING".equals(setting.getStatus())) {
            deductionRepo.delete(setting);
        }
    }
}
