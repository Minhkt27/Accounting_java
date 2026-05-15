package com.accounting.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LedgerResponse {
    private PageResponse<java.util.Map<String, Object>> pageResponse;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
}
