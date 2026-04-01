package com.accounting.app.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.accounting.app.payload.request.LoginRequest;
import com.accounting.app.payload.response.JwtResponse;
import com.accounting.app.security.jwt.JwtUtils;
import com.accounting.app.security.services.UserDetailsImpl;
import com.accounting.app.model.RolePermission;
import com.accounting.app.repository.RolePermissionRepository;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    RolePermissionRepository permissionRepo;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Login request received for user: {}", loginRequest.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();    
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt, 
                                                 userDetails.getId(), 
                                                 userDetails.getUsername(), 
                                                 userDetails.getEmail(), 
                                                 roles));
    }

    /**
     * Lấy danh sách function codes mà user hiện tại được phép truy cập.
     * Mọi user đã đăng nhập đều gọi được (không cần ADMIN).
     */
    @GetMapping("/my-permissions")
    public ResponseEntity<List<String>> getMyPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
        
        // Admin có mọi quyền
        boolean isAdmin = authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return ResponseEntity.ok(List.of(
                "CONFIG_ACCOUNT", "CONFIG_INSURANCE", "HR_EMPLOYEE", "HR_ATTENDANCE",
                "HR_LEAVE", "PAYROLL_CALCULATE", "PAYROLL_APPROVE", "ACCOUNTING_VIEW", "ADMIN_USERS"
            ));
        }

        Set<String> allowed = new HashSet<>();
        for (GrantedAuthority authority : authorities) {
            List<RolePermission> perms = permissionRepo.findByRoleName(authority.getAuthority());
            for (RolePermission p : perms) {
                if (Boolean.TRUE.equals(p.getAllowed())) {
                    allowed.add(p.getFunctionCode());
                }
            }
        }
        return ResponseEntity.ok(new ArrayList<>(allowed));
    }
}
