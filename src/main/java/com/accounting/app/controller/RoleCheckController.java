package com.accounting.app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.accounting.app.security.jwt.JwtUtils;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug/test-roles")
public class RoleCheckController {

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    JwtUtils jwtUtils;

    @GetMapping("/login-test")
    public Map<String, Object> testLogins() {
        Map<String, Object> res = new HashMap<>();
        res.put("ketoan_truong", tryLogin("ketoan_truong", "123456"));
        res.put("ketoan_luong", tryLogin("ketoan_luong", "123456"));
        return res;
    }

    private String tryLogin(String username, String password) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
            return jwtUtils.generateJwtToken(authentication);
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }
}
