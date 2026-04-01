package com.accounting.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceSuggestion {
    private Double physicalDays;   /* Số ngày thực tế đi làm (Physical presence) */
    private Double paidLeaveDays;  /* Số ngày nghỉ hưởng lương (Paid leave - e.g. ANNUAL) */
}
