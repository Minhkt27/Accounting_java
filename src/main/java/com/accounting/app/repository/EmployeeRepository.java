package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.Employee;
import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, String> {
    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE e.status = 'WORKING' OR e.status = 'ON_LEAVE' ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Employee> findAllActive(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e WHERE ((e.status <> 'LEFT') OR (e.resignationDate IS NOT NULL AND e.resignationDate >= :date)) AND (e.createdAt IS NULL OR e.createdAt <= :endDate) ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Employee> findActiveAt(@org.springframework.data.repository.query.Param("date") java.time.LocalDate date, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    org.springframework.data.domain.Page<Employee> findAllSorted(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Employee e ORDER BY e.createdAt DESC NULLS LAST, e.id DESC")
    List<Employee> findAllSortedList();

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(e) FROM Employee e WHERE e.status = 'WORKING' OR e.status = 'ON_LEAVE'")
    Long countActive();

    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.id) FROM Employee e WHERE e.id LIKE 'NV%'")
    String findMaxId();

    default Long countByActiveTrue() {
        return countActive();
    }
}
