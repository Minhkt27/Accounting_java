package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.SalaryParameter;

@Repository
public interface SalaryParameterRepository extends JpaRepository<SalaryParameter, Long> {
}
