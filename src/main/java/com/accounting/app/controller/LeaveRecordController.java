package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.accounting.app.model.LeaveRecord;
import com.accounting.app.repository.LeaveRecordRepository;
import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/leaves")
public class LeaveRecordController {
    @Autowired private LeaveRecordRepository leaveRepo;

    @GetMapping
    @PreAuthorize("@perm.check('HR_LEAVE')")
    public List<LeaveRecord> getAll() { return leaveRepo.findAll(); }

    @PostMapping
    @PreAuthorize("@perm.check('HR_LEAVE')")
    public LeaveRecord create(@Valid @RequestBody LeaveRecord record) {
        if (record.getStartDate().isAfter(record.getEndDate())) {
            throw new RuntimeException("Ngày bắt đầu không thể sau ngày kết thúc");
        }
        
        boolean overlaps = leaveRepo.existsByEmployeeIdAndOverlap(
            record.getEmployee().getId(), 
            record.getStartDate(), 
            record.getEndDate()
        );
        
        if (overlaps) {
            throw new RuntimeException("Nhân viên đã có lịch nghỉ trùng với khoảng thời gian này");
        }
        
        return leaveRepo.save(record); 
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('HR_LEAVE')")
    public LeaveRecord update(@PathVariable Long id, @Valid @RequestBody LeaveRecord record) {
        LeaveRecord existing = leaveRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi nghỉ phép với ID: " + id));

        if (record.getStartDate().isAfter(record.getEndDate())) {
            throw new RuntimeException("Ngày bắt đầu không thể sau ngày kết thúc");
        }

        boolean overlaps = leaveRepo.existsByEmployeeIdAndOverlapExcludingId(
            record.getEmployee().getId(),
            id,
            record.getStartDate(),
            record.getEndDate()
        );

        if (overlaps) {
            throw new RuntimeException("Nhân viên đã có lịch nghỉ trùng với khoảng thời gian này");
        }

        existing.setEmployee(record.getEmployee());
        existing.setLeaveType(record.getLeaveType());
        existing.setStartDate(record.getStartDate());
        existing.setEndDate(record.getEndDate());

        return leaveRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('HR_LEAVE')")
    public void delete(@PathVariable Long id) { leaveRepo.deleteById(id); }
}
