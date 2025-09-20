package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.dto.LoginRequest;
import com.voroshapay.dto.RegisterRequest;
import com.voroshapay.dto.UserResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${app.frontend.url}")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(request.getFullName(), request.getEmail(), 
                                             request.getPhone(), request.getPassword());
            
            String token = jwtUtil.generateToken(user.getId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", new UserResponse(user));
            data.put("token", token);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        try {
            User user = userService.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
            
            if (!userService.verifyPassword(user, request.getPassword())) {
                throw new RuntimeException("Invalid credentials");
            }
            
            String token = jwtUtil.generateToken(user.getId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", new UserResponse(user));
            data.put("token", token);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", data));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Login failed";
            if (msg.toLowerCase().contains("invalid credentials")) {
                return ResponseEntity.status(401)
                    .body(new ApiResponse<>(false, "Invalid credentials", null));
            }
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, msg, null));
        }
    }

    @PostMapping("/demo-login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> demoLogin(@RequestParam(defaultValue = "user") String role) {
        try {
            // Create a simple demo user without database operations for now
            String email = "demo@demo.com";
            String fullName = "Demo User";
            Long userId = 1L;
            
            // Generate token
            String token = jwtUtil.generateToken(userId);
            
            // Create a simple user response
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", userId);
            userData.put("fullName", fullName);
            userData.put("email", email);
            userData.put("phone", "+8801234567890");
            userData.put("isVerified", true);
            userData.put("roles", Arrays.asList("USER"));
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", userData);
            data.put("token", token);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Demo login successful", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Demo login failed: " + e.getMessage(), null));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(@AuthenticationPrincipal User user) {
        Map<String, Object> data = new HashMap<>();
        data.put("user", new UserResponse(user));
        return ResponseEntity.ok(new ApiResponse<>(true, "User details retrieved", data));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        try {
            User updatedUser = userService.updateProfile(user.getId(), 
                request.get("fullName"), request.get("phone"));
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", new UserResponse(updatedUser));
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPhone(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        try {
            String verificationCode = request.get("verificationCode");
            
            // Simple verification - in real implementation, verify against SMS service
            if (!"123456".equals(verificationCode)) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Invalid verification code", null));
            }
            
            User verifiedUser = userService.verifyUser(user.getId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", new UserResponse(verifiedUser));
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Phone verified successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changePassword(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Current password and new password are required", null));
            }
            
            // Verify current password
            if (!userService.verifyPassword(user, currentPassword)) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Current password is incorrect", null));
            }
            
            // Update password
            user.setPassword(userService.encodePassword(newPassword));
            User updatedUser = userService.updateUser(user);
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", new UserResponse(updatedUser));
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Password changed successfully", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
} 