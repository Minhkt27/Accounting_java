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
import com.accounting.app.repository.EmployeeRepository;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.OptionalInt;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    @Autowired
    private EmployeeRepository employeeRepository;

    private final Path root = Paths.get("uploads/contracts");

    @GetMapping
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    @GetMapping("/next-id")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public String getNextId() {
        List<Employee> all = employeeRepository.findAll();
        OptionalInt max = all.stream()
                .map(Employee::getId)
                .filter(id -> id != null && id.startsWith("NV"))
                .mapToInt(id -> {
                    try {
                        return Integer.parseInt(id.substring(2));
                    } catch (Exception e) {
                        return 0;
                    }
                })
                .max();

        int next = max.isPresent() ? max.getAsInt() + 1 : 1;
        return String.format("NV%03d", next);
    }

    @PostMapping
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public Employee create(@Valid @RequestBody Employee emp) {
        return employeeRepository.save(emp);
    }

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
        return employeeRepository.save(emp);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('HR_EMPLOYEE')")
    public void delete(@PathVariable String id) {
        employeeRepository.deleteById(id);
    }

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