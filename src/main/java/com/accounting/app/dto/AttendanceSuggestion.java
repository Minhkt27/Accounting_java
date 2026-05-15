package com.accounting.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceSuggestion {
    private BigDecimal physicalDays;   /* Số ngày thực tế đi làm (Physical presence) */
    private BigDecimal paidLeaveDays;  /* Số ngày nghỉ hưởng lương (Paid leave - e.g. ANNUAL) */
}
