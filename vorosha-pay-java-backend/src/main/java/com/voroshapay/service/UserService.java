package com.voroshapay.service;

import com.voroshapay.entity.User;
import com.voroshapay.entity.UserRole;
import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserService {

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User mapToUser(Map<String, String> row) {
        if (row == null) return null;
        User u = new User();
        u.setId(Long.parseLong(row.get("id")));
        u.setFullName(row.get("fullName"));
        u.setEmail(row.get("email"));
        u.setPhone(row.get("phone"));
        u.setPassword(row.get("password"));
        u.setIsVerified(Boolean.parseBoolean(row.getOrDefault("isVerified", "false")));
        u.setIsPhoneVerified(Boolean.parseBoolean(row.getOrDefault("isPhoneVerified", "false")));
        u.setIsNIDVerified(Boolean.parseBoolean(row.getOrDefault("isNIDVerified", "false")));
        // roles
        List<Map<String, String>> roles = excel.findMany("user_roles", Map.of("userId", String.valueOf(u.getId())));
        Set<UserRole> roleSet = new HashSet<>();
        for (Map<String, String> r : roles) {
            try { roleSet.add(UserRole.valueOf(r.get("role").toUpperCase())); } catch (Exception ignore) {}
        }
        if (roleSet.isEmpty()) roleSet.add(UserRole.USER);
        u.setRoles(roleSet);
        return u;
    }

    public User createUser(String fullName, String email, String phone, String password) {
        if (findByEmail(email).isPresent()) throw new RuntimeException("User with this email already exists");
        if (phone != null && !phone.isEmpty() && findByPhone(phone).isPresent()) throw new RuntimeException("User with this phone number already exists");
        Map<String, String> data = new HashMap<>();
        data.put("fullName", fullName);
        data.put("email", email);
        data.put("phone", phone == null ? "" : phone);
        data.put("password", passwordEncoder.encode(password));
        data.put("isVerified", "false");
        data.put("isPhoneVerified", "false");
        data.put("isNIDVerified", "false");
        Map<String, String> created = excel.create("users", data);
        // default role USER
        excel.create("user_roles", Map.of(
            "userId", created.get("id"),
            "role", "USER",
            "assignedAt", Optional.ofNullable(created.get("createdAt")).orElse("")
        ));
        return mapToUser(created);
    }

    private Optional<User> findByPhone(String phone) {
        if (phone == null || phone.isEmpty()) return Optional.empty();
        Map<String, String> row = excel.findOne("users", Map.of("phone", phone));
        return Optional.ofNullable(mapToUser(row));
    }

    public Optional<User> findByEmail(String email) {
        Map<String, String> row = excel.findOne("users", Map.of("email", email));
        return Optional.ofNullable(mapToUser(row));
    }

    public Optional<User> findById(Long id) {
        Map<String, String> row = excel.findById("users", id);
        return Optional.ofNullable(mapToUser(row));
    }

    public User updateUser(User user) {
        Map<String, String> data = new HashMap<>();
        data.put("fullName", user.getFullName());
        data.put("email", user.getEmail());
        data.put("phone", user.getPhone());
        data.put("password", user.getPassword());
        data.put("isVerified", String.valueOf(user.getIsVerified() != null && user.getIsVerified()));
        data.put("isPhoneVerified", String.valueOf(user.getIsPhoneVerified() != null && user.getIsPhoneVerified()));
        data.put("isNIDVerified", String.valueOf(user.getIsNIDVerified() != null && user.getIsNIDVerified()));
        Map<String, String> updated = excel.update("users", user.getId(), data);
        return mapToUser(updated);
    }

    public User updateProfile(Long userId, String fullName, String phone) {
        User user = findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (fullName != null) user.setFullName(fullName);
        if (phone != null) user.setPhone(phone);
        return updateUser(user);
    }

    public boolean verifyPassword(User user, String password) {
        return passwordEncoder.matches(password, user.getPassword());
    }

    public User verifyUser(Long userId) {
        User user = findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsVerified(true);
        return updateUser(user);
    }
    
    public User verifyPhone(Long userId) {
        User user = findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsPhoneVerified(true);
        // Also set isVerified to true if both phone and NID are verified
        if (user.getIsNIDVerified() != null && user.getIsNIDVerified()) {
            user.setIsVerified(true);
        }
        return updateUser(user);
    }
    
    public User verifyNID(Long userId) {
        User user = findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsNIDVerified(true);
        // Also set isVerified to true if both phone and NID are verified
        if (user.getIsPhoneVerified() != null && user.getIsPhoneVerified()) {
            user.setIsVerified(true);
        }
        return updateUser(user);
    }
    
    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }
} 