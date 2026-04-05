package com.accounting.app.repository;

import com.accounting.app.model.InsuranceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsuranceConfigRepository extends JpaRepository<InsuranceConfig, Long> {
}
