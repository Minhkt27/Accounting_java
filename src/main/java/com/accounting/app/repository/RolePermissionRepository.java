package com.accounting.app.repository;

import com.accounting.app.model.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    Optional<RolePermission> findByRoleNameAndFunctionCode(String roleName, String functionCode);
    boolean existsByRoleNameAndFunctionCode(String roleName, String functionCode);
    List<RolePermission> findByRoleName(String roleName);
    List<RolePermission> findByFunctionCode(String functionCode);
    void deleteByRoleName(String roleName);
}
