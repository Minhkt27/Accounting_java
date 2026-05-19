package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import com.accounting.app.model.Employee;
import com.accounting.app.model.EmployeeStatus;
import com.accounting.app.repository.EmployeeRepository;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.OptionalInt;

/**
 * Controller quản lý hồ sơ nhân viên (thông tin cá nhân, phòng ban, trạng thái làm việc, hợp đồng lao động).
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private com.accounting.app.repository.LeaveRecordRepository leaveRepository;

    // Thư mục lưu trữ tệp PDF hợp đồng lao động của nhân viên
    private final Path root = Paths.get("uploads/contracts");

    /**
     * Lấy danh sách nhân viên (phân trang).
     * Hỗ trợ lọc nhân viên đang hoạt động tại một tháng/năm cụ thể.
     * Tự động xác định trạng thái đang nghỉ phép (onLeave) tại thời điểm kiểm tra.
     */
    @GetMapping
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public com.accounting.app.dto.PageResponse<Employee> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        org.springframework.data.domain.Page<Employee> result;
        if (month != null && year != null) {
            java.time.LocalDate targetDate = java.time.LocalDate.of(year, month, 1);
            java.time.LocalDate endDate = targetDate.withDayOfMonth(targetDate.lengthOfMonth());
            // Chỉ lấy những nhân viên đang hoạt động trong khoảng thời gian này (chưa nghỉ việc hoặc bắt đầu vào làm)
            result = employeeRepository.findActiveAt(targetDate, endDate, org.springframework.data.domain.PageRequest.of(page, size));
        } else {
            result = employeeRepository.findAllSorted(org.springframework.data.domain.PageRequest.of(page, size));
        }

        // Xác định mốc thời gian để kiểm tra xem nhân viên có đang nghỉ phép (onLeave) hay không
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate checkDate;
        if (month != null && year != null) {
            if (year == today.getYear() && month == today.getMonthValue()) {
                checkDate = today;
            } else {
                java.time.LocalDate firstDayOfMonth = java.time.LocalDate.of(year, month, 1);
                checkDate = firstDayOfMonth.withDayOfMonth(firstDayOfMonth.lengthOfMonth());
            }
        } else {
            checkDate = today;
        }

        // Lấy danh sách các nhân viên đang có lịch nghỉ được duyệt vào ngày checkDate
        java.util.List<com.accounting.app.model.LeaveRecord> activeLeaves = leaveRepository.findActiveLeaves(checkDate);
        java.util.Set<String> onLeaveIds = activeLeaves.stream()
                .map(lr -> lr.getEmployee().getId())
                .collect(java.util.stream.Collectors.toSet());

        // Map trạng thái đang nghỉ phép vào DTO trả về cho UI hiển thị icon/badge tương ứng
        result.getContent().forEach(emp -> {
            if (onLeaveIds.contains(emp.getId())) {
                emp.setOnLeave(true);
            }
        });

        return new com.accounting.app.dto.PageResponse<>(
            result.getContent(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.isLast()
        );
    }

    /**
     * Sinh tự động mã nhân viên tiếp theo theo định dạng: NV001, NV002, NV003,...
     */
    @GetMapping("/next-id")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public String getNextId() {
        String maxId = employeeRepository.findMaxId();
        int next = 1;
        if (maxId != null && maxId.startsWith("NV")) {
            try {
                next = Integer.parseInt(maxId.substring(2)) + 1;
            } catch (Exception e) {
                // Bỏ qua lỗi parse
            }
        }
        return String.format("NV%03d", next);
    }

    /**
     * Tạo mới thông tin nhân viên.
     */
    @PostMapping
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public Employee create(@Valid @RequestBody Employee emp) {
        return employeeRepository.save(emp);
    }

    /**
     * Cập nhật thông tin chi tiết của nhân viên.
     * Nếu cập nhật trạng thái sang nghỉ việc (LEFT), tự động gán ngày nghỉ việc nếu chưa khai báo.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public Employee update(@PathVariable String id, @Valid @RequestBody Employee details) {
        Employee emp = employeeRepository.findById(id).orElseThrow();
        emp.setFullName(details.getFullName());
        emp.setContractSalary(details.getContractSalary());
        emp.setDependentCount(details.getDependentCount());
        emp.setEmployeeType(details.getEmployeeType());
        emp.setActive(details.getActive());
        emp.setDob(details.getDob());
        emp.setPhone(details.getPhone());
        emp.setEmail(details.getEmail());
        emp.setHometown(details.getHometown());
        emp.setDepartment(details.getDepartment());
        emp.setGender(details.getGender());
        emp.setResignationDate(details.getResignationDate());
        
        if (details.getStatus() != null) {
            emp.setStatus(details.getStatus());
            if (details.getStatus() == com.accounting.app.model.EmployeeStatus.LEFT && emp.getResignationDate() == null) {
                emp.setResignationDate(java.time.LocalDate.now());
            }
        }

        return employeeRepository.save(emp);
    }

    /**
     * Xóa nhân viên (Soft Delete - Chuyển trạng thái sang LEFT và gán ngày nghỉ việc là hôm nay).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public void delete(@PathVariable String id) {
        Employee emp = employeeRepository.findById(id).orElseThrow();
        emp.setStatus(EmployeeStatus.LEFT);
        emp.setResignationDate(java.time.LocalDate.now());
        employeeRepository.save(emp);
    }

    /**
     * Tải lên file Hợp đồng lao động dạng PDF của nhân viên.
     */
    @PostMapping("/upload-contract/{id}")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public ResponseEntity<String> uploadContract(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        try {
            if (!Files.exists(root))
                Files.createDirectories(root);
            String filename = id + "_contract.pdf";
            Files.copy(file.getInputStream(), this.root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            Employee emp = employeeRepository.findById(id).orElseThrow();
            emp.setContractFilePath(filename);
            employeeRepository.save(emp);
            return ResponseEntity.ok("Success: " + filename);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Tải xuống hoặc xem trực tuyến Hợp đồng lao động PDF của nhân viên.
     */
    @GetMapping("/download-contract/{id}")
    @PreAuthorize("hasRole('NHAN_SU') or hasRole('KE_TOAN_LUONG') or hasRole('ADMIN')")
    public ResponseEntity<Resource> downloadContract(@PathVariable String id) {
        try {
            Employee emp = employeeRepository.findById(id).orElseThrow();
            if (emp.getContractFilePath() == null)
                return ResponseEntity.notFound().build();
            Path file = root.resolve(emp.getContractFilePath());
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.status(500).build();
        }
    }
}