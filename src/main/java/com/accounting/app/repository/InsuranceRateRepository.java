package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.InsuranceRate;

@Repository
public interface InsuranceRateRepository extends JpaRepository<InsuranceRate, Long> {
}
