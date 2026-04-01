package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.AccountCategory;

@Repository
public interface AccountCategoryRepository extends JpaRepository<AccountCategory, String> {
}
