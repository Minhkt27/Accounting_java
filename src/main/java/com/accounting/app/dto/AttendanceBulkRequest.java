package com.accounting.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AttendanceBulkRequest {
    private List<String> employeeIds;
    private Integer month;
    private Integer year;
    private Double standardDays;
}
