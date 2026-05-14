package com.accounting.app.dto;

import com.accounting.app.model.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfigResponse {
    private List<SalaryParameter> params;
    private List<InsuranceConfig> insurance;
    private List<TaxTier> taxTiers;
    private List<DeductionSetting> deductions;
    private List<EmployeeTaxConfig> taxRules;
}
