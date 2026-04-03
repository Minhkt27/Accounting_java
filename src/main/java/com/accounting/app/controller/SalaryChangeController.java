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

            // UC: Tự động phê duyệt nếu là Nhân sự tạo (trừ biến động Lương) hoặc Admin tạo
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isHR = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_NHAN_SU"));
            boolean isSalaryType = "SALARY_ADJUSTMENT".equals(change.getChangeType());

            if (isAdmin || isHR) {
                change.setStatus("APPROVED");
                change.setApprovedBy(auth.getName());
                change.setApprovedAt(java.time.LocalDateTime.now());
                
                // Tự động cập nhật lương nếu là Điều chỉnh lương hoặc Thăng chức
                if ("SALARY_ADJUSTMENT".equals(change.getChangeType()) || "PROMOTION".equals(change.getChangeType())) {
                    emp.setContractSalary(change.getNewValue());
                    employeeRepo.save(emp);
                }
            }

            changeRepo.save(change);
            return ResponseEntity.ok(Map.of(
                "message", change.getStatus().equals("APPROVED") ? "Đã cập nhật biến động thành công!" : "Đã tạo đề xuất biến động thành công", 
                "status", change.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Cập nhật biến động — Chỉ HR hoặc Admin
     */
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE')")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            SalaryChange change = changeRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến động #" + id));

            change.setChangeType((String) body.get("changeType"));
            change.setOldValue(toDouble(body.get("oldValue")));
            change.setNewValue(toDouble(body.get("newValue")));
            change.setReason((String) body.get("reason"));
            change.setEffectiveDate(java.time.LocalDate.parse((String) body.get("effectiveDate")));

            // Nếu HR hoặc Admin sửa => đảm bảo trạng thái APPROVED và cập nhật lương nhân viên
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            boolean isHR = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_NHAN_SU"));
            
            if (isAdmin || isHR) {
                change.setStatus("APPROVED");
                if ("SALARY_ADJUSTMENT".equals(change.getChangeType()) || "PROMOTION".equals(change.getChangeType())) {
                    Employee emp = change.getEmployee();
                    emp.setContractSalary(change.getNewValue());
                    employeeRepo.save(emp);
                }
            }

            changeRepo.save(change);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật biến động thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Xóa biến động — Chỉ HR hoặc Admin
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('HR_SALARY_CHANGE')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            SalaryChange change = changeRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến động #" + id));
            changeRepo.delete(change);
            return ResponseEntity.ok(Map.of("message", "Đã xóa biến động thành công"));
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
