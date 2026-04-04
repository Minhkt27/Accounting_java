package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.EmployeeTaxConfig;
import com.accounting.app.model.EmployeeType;
import java.util.Optional;

@Repository
public interface EmployeeTaxConfigRepository extends JpaRepository<EmployeeTaxConfig, Long> {
    Optional<EmployeeTaxConfig> findByEmployeeType(EmployeeType employeeType);
}
