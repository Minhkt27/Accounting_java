package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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
    public InsuranceRate saveInsurance(@RequestBody InsuranceRate rate) { return insuranceRepo.save(rate); }

    // UC 03: Salary Params
    @GetMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<SalaryParameter> getParams() { return salaryRepo.findAll(); }

    @PostMapping("/params")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public SalaryParameter saveParam(@RequestBody SalaryParameter param) { return salaryRepo.save(param); }

    // UC 04, 05: Tax Tiers
    @GetMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> getTaxTiers() { return taxRepo.findAllByOrderByTierLevelAsc(); }

    @PostMapping("/tax")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<TaxTier> saveTaxTiers(@RequestBody List<TaxTier> tiers) {
        taxRepo.deleteAll();
        return taxRepo.saveAll(tiers);
    }

    // UC 06: Deductions
    @GetMapping("/deductions")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public List<DeductionSetting> getDeductions() { return deductionRepo.findAll(); }

    @PostMapping("/deductions")
    @PreAuthorize("@perm.check('CONFIG_INSURANCE')")
    public DeductionSetting saveDeduction(@RequestBody DeductionSetting setting) { return deductionRepo.save(setting); }
}
