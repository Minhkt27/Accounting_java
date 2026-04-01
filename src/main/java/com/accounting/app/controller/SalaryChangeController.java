package com.accounting.app.controller;

import com.accounting.app.model.Employee;
import com.accounting.app.model.SalaryChange;
import com.accounting.app.repository.EmployeeRepository;
import com.accounting.app.repository.SalaryChangeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/salary-changes")
public class SalaryChangeController {

    @Autowired private SalaryChangeRepository changeRepo;
    @Autowired private EmployeeRepository employeeRepo;

    /**
     * Lấy danh sách tất cả biến động (hỗ trợ filter theo status)
     */
    @GetMapping
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE') or @perm.check('HR_SALARY_CHANGE_APPROVE')")
    public ResponseEntity<List<Map<String, Object>>> getAll(@RequestParam(required = false) String status) {
        List<SalaryChange> changes;
        if (status != null && !status.isEmpty()) {
            changes = changeRepo.findByStatus(status);
        } else {
            changes = changeRepo.findAllByOrderByCreatedAtDesc();
        }

        List<Map<String, Object>> result = changes.stream().map(c -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("employeeId", c.getEmployee().getId());
            map.put("employeeName", c.getEmployee().getFullName());
            map.put("changeType", c.getChangeType());
            map.put("oldValue", c.getOldValue());
            map.put("newValue", c.getNewValue());
            map.put("reason", c.getReason());
            map.put("effectiveDate", c.getEffectiveDate());
            map.put("status", c.getStatus());
            map.put("createdBy", c.getCreatedBy());
            map.put("approvedBy", c.getApprovedBy());
            map.put("approvedAt", c.getApprovedAt());
            map.put("rejectionReason", c.getRejectionReason());
            map.put("createdAt", c.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Tạo đề xuất biến động mới
     */
    @PostMapping
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE')")
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            String employeeId = (String) body.get("employeeId");
            Employee emp = employeeRepo.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhân viên: " + employeeId));

            SalaryChange change = new SalaryChange();
            change.setEmployee(emp);
            change.setChangeType((String) body.get("changeType"));
            change.setOldValue(toDouble(body.get("oldValue")));
            change.setNewValue(toDouble(body.get("newValue")));
            change.setReason((String) body.get("reason"));
            change.setEffectiveDate(java.time.LocalDate.parse((String) body.get("effectiveDate")));
            change.setStatus("PENDING");

            // Lấy username của người tạo
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            change.setCreatedBy(auth.getName());

            changeRepo.save(change);
            return ResponseEntity.ok(Map.of("message", "Đã tạo đề xuất biến động thành công", "id", change.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Phê duyệt biến động — Chỉ Kế toán trưởng
     * Khi phê duyệt SALARY_ADJUSTMENT hoặc PROMOTION, tự động cập nhật lương nhân viên
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE_APPROVE')")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            SalaryChange change = changeRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến động #" + id));

            if (!"PENDING".equals(change.getStatus())) {
                throw new RuntimeException("Chỉ có thể phê duyệt biến động đang ở trạng thái PENDING");
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            change.setStatus("APPROVED");
            change.setApprovedBy(auth.getName());
            change.setApprovedAt(LocalDateTime.now());
            changeRepo.save(change);

            // Nếu là điều chỉnh lương hoặc thăng chức => tự động cập nhật lương HĐ
            if ("SALARY_ADJUSTMENT".equals(change.getChangeType()) || "PROMOTION".equals(change.getChangeType())) {
                Employee emp = change.getEmployee();
                emp.setContractSalary(change.getNewValue());
                employeeRepo.save(emp);
            }

            return ResponseEntity.ok(Map.of("message", "Đã phê duyệt biến động #" + id + " thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Từ chối biến động — Chỉ Kế toán trưởng
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE_APPROVE')")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            SalaryChange change = changeRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến động #" + id));

            if (!"PENDING".equals(change.getStatus())) {
                throw new RuntimeException("Chỉ có thể từ chối biến động đang ở trạng thái PENDING");
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            change.setStatus("REJECTED");
            change.setApprovedBy(auth.getName());
            change.setApprovedAt(LocalDateTime.now());
            change.setRejectionReason(body.get("reason"));
            changeRepo.save(change);

            return ResponseEntity.ok(Map.of("message", "Đã từ chối biến động #" + id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Number) return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }
}
