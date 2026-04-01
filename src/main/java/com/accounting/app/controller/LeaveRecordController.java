package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.accounting.app.model.LeaveRecord;
import com.accounting.app.repository.LeaveRecordRepository;
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
    public LeaveRecord create(@RequestBody LeaveRecord record) { return leaveRepo.save(record); }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('HR_LEAVE')")
    public void delete(@PathVariable Long id) { leaveRepo.deleteById(id); }
}
