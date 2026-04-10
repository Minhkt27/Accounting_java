package com.accounting.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LedgerResponse {
    private PageResponse<java.util.Map<String, Object>> pageResponse;
    private double totalDebit;
    private double totalCredit;
}
