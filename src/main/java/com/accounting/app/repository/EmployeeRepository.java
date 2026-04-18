package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.Employee;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE e.status = 'WORKING' OR e.status = 'ON_LEAVE' ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Employee> findAllActive(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Employee> findAllSorted(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    List<Employee> findAllSortedList();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM Employee e WHERE e.status = 'WORKING' OR e.status = 'ON_LEAVE'")
    Long countActive();

    default Long countByActiveTrue() {
        return countActive();
    }
}
