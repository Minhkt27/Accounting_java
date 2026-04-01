package com.accounting.app.controller;

import com.accounting.app.model.*;
import com.accounting.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("@perm.check('ADMIN_USERS')")
public class UserManagementController {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RolePermissionRepository permissionRepository;
    @Autowired private PasswordEncoder encoder;

    /**
     * Lấy danh sách tất cả người dùng
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("roles", u.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toList()));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy danh sách tất cả Roles
     */
    @GetMapping("/roles")
    public ResponseEntity<List<Map<String, Object>>> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        List<Map<String, Object>> result = roles.stream().map(r -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", r.getId());
            map.put("name", r.getName().name());
            map.put("displayName", getRoleDisplayName(r.getName()));
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Tạo người dùng mới
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        @SuppressWarnings("unchecked")
        List<String> roleNames = (List<String>) request.get("roles");

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body("Tên đăng nhập đã tồn tại!");
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body("Email đã được sử dụng!");
        }

        User user = new User(username, email, encoder.encode(password));
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            ERole eRole = ERole.valueOf(roleName);
            Role role = roleRepository.findByName(eRole)
                    .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + roleName));
            roles.add(role);
        }
        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok("Tạo tài khoản thành công!");
    }

    /**
     * Cập nhật thông tin người dùng (email, roles)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user id=" + id));

        if (request.containsKey("email")) {
            user.setEmail((String) request.get("email"));
        }
        if (request.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> roleNames = (List<String>) request.get("roles");
            Set<Role> roles = new HashSet<>();
            for (String roleName : roleNames) {
                ERole eRole = ERole.valueOf(roleName);
                Role role = roleRepository.findByName(eRole)
                        .orElseThrow(() -> new RuntimeException("Role không tồn tại: " + roleName));
                roles.add(role);
            }
            user.setRoles(roles);
        }
        userRepository.save(user);
        return ResponseEntity.ok("Cập nhật thành công!");
    }

    /**
     * Đổi mật khẩu người dùng
     */
    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user id=" + id));
        user.setPassword(encoder.encode(request.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok("Đổi mật khẩu thành công!");
    }

    /**
     * Xóa tài khoản
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user id=" + id));
        // Không cho xóa chính mình (admin)
        if (user.getUsername().equals("admin")) {
            return ResponseEntity.badRequest().body("Không thể xóa tài khoản admin gốc!");
        }
        userRepository.delete(user);
        return ResponseEntity.ok("Đã xóa tài khoản!");
    }

    /**
     * Lấy toàn bộ ma trận phân quyền
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, Object>>> getPermissions() {
        List<RolePermission> all = permissionRepository.findAll();
        List<Map<String, Object>> result = all.stream().map(p -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", p.getId());
            map.put("roleName", p.getRoleName());
            map.put("functionCode", p.getFunctionCode());
            map.put("allowed", p.getAllowed());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Cập nhật ma trận phân quyền (batch)
     */
    @PutMapping("/permissions")
    public ResponseEntity<?> updatePermissions(@RequestBody List<Map<String, Object>> updates) {
        for (Map<String, Object> entry : updates) {
            String roleName = (String) entry.get("roleName");
            String functionCode = (String) entry.get("functionCode");
            Boolean allowed = (Boolean) entry.get("allowed");

            RolePermission perm = permissionRepository
                    .findByRoleNameAndFunctionCode(roleName, functionCode)
                    .orElse(new RolePermission(roleName, functionCode, false));
            perm.setAllowed(allowed);
            permissionRepository.save(perm);
        }
        return ResponseEntity.ok("Cập nhật phân quyền thành công!");
    }

    private String getRoleDisplayName(ERole role) {
        return switch (role) {
            case ROLE_ADMIN -> "Quản trị viên";
            case ROLE_NHAN_SU -> "Phòng Nhân sự";
            case ROLE_KE_TOAN_LUONG -> "Kế toán Tiền lương";
            case ROLE_KE_TOAN_TRUONG -> "Kế toán Trưởng";
        };
    }
}
