package com.accounting.app.service;

import com.accounting.app.repository.RolePermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Collection;

/**
 * PermissionService — kiểm tra quyền truy cập động từ Database.
 * Được dùng trong @PreAuthorize("@perm.check('FUNCTION_CODE')")
 * 
 * ROLE_ADMIN luôn bypass (có mọi quyền).
 */
@Service("perm")
public class PermissionService {

    @Autowired
    private RolePermissionRepository permissionRepo;

    /**
     * Kiểm tra user hiện tại có quyền truy cập functionCode hay không.
     */
    public boolean check(String functionCode) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;

        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();

        // ADMIN bypass — luôn có mọi quyền
        boolean isAdmin = authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return true;

        // Kiểm tra từng role của user với functionCode
        for (GrantedAuthority authority : authorities) {
            String roleName = authority.getAuthority();
            var permission = permissionRepo.findByRoleNameAndFunctionCode(roleName, functionCode);
            if (permission.isPresent() && Boolean.TRUE.equals(permission.get().getAllowed())) {
                return true;
            }
        }
        return false;
    }
}
