package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.accounting.app.model.AccountCategory;
import com.accounting.app.repository.AccountCategoryRepository;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
@RestController
@RequestMapping("/api/config/accounts")
public class AccountCategoryController {

    @Autowired
    private AccountCategoryRepository repository;

    @GetMapping
    @PreAuthorize("@perm.check('CONFIG_ACCOUNT')")
    public List<AccountCategory> getAll() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("@perm.check('CONFIG_ACCOUNT')")
    public AccountCategory create(@RequestBody AccountCategory acc) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAutoApprove = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        
        acc.setStatus(isAutoApprove ? "APPROVED" : "PENDING");
        return repository.save(acc);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.check('CONFIG_ACCOUNT')")
    public AccountCategory update(@PathVariable String id, @RequestBody AccountCategory acc) {
        AccountCategory existing = repository.findById(id).orElseThrow();
        existing.setName(acc.getName());
        existing.setType(acc.getType());
        existing.setEnglishName(acc.getEnglishName());
        existing.setParentId(acc.getParentId());
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAutoApprove = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_KE_TOAN_TRUONG"));
        if (isAutoApprove) {
            existing.setStatus("APPROVED");
        }
        
        return repository.save(existing);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@perm.check('CONFIG_ACCOUNT')")
    public void delete(@PathVariable String id) {
        repository.deleteById(id);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_KE_TOAN_TRUONG')")
    public AccountCategory approve(@PathVariable String id) {
        AccountCategory acc = repository.findById(id).orElseThrow();
        acc.setStatus("APPROVED");
        return repository.save(acc);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_KE_TOAN_TRUONG')")
    public AccountCategory reject(@PathVariable String id) {
        AccountCategory acc = repository.findById(id).orElseThrow();
        acc.setStatus("REJECTED");
        return repository.save(acc);
    }
}
