package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
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
        acc.setStatus("PENDING");
        return repository.save(acc);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("@perm.check('CONFIG_ACCOUNT')")
    public AccountCategory approve(@PathVariable String id) {
        AccountCategory acc = repository.findById(id).orElseThrow();
        acc.setStatus("APPROVED");
        return repository.save(acc);
    }
}
