package com.voroshapay.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

public class User {
    
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    
    @JsonIgnore
    private String password;
    
    private Boolean isVerified = false;
    private Boolean isPhoneVerified = false;
    private Boolean isNIDVerified = false;
    private Set<UserRole> roles = new HashSet<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public User() {}
    
    public User(String fullName, String email, String phone, String password) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.roles.add(UserRole.USER);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    
    public Boolean getIsPhoneVerified() { return isPhoneVerified; }
    public void setIsPhoneVerified(Boolean isPhoneVerified) { this.isPhoneVerified = isPhoneVerified; }
    
    public Boolean getIsNIDVerified() { return isNIDVerified; }
    public void setIsNIDVerified(Boolean isNIDVerified) { this.isNIDVerified = isNIDVerified; }
    
    public Set<UserRole> getRoles() { return roles; }
    public void setRoles(Set<UserRole> roles) { this.roles = roles; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public boolean hasRole(UserRole role) {
        return roles.contains(role);
    }
    
    public void addRole(UserRole role) {
        this.roles.add(role);
    }
    
    public void removeRole(UserRole role) {
        this.roles.remove(role);
    }
    
    public boolean isAdmin() {
        return roles.contains(UserRole.ADMIN);
    }
    
    public boolean isFullyVerified() {
        return Boolean.TRUE.equals(isPhoneVerified) && Boolean.TRUE.equals(isNIDVerified);
    }
    
    public boolean needsVerification() {
        return !Boolean.TRUE.equals(isPhoneVerified) || !Boolean.TRUE.equals(isNIDVerified);
    }
    
    public boolean canPerformTransactions() {
        return isVerified != null && isVerified;
    }
    
    // Additional helper methods for frontend compatibility
    public String getPrimaryRole() {
        if (roles == null || roles.isEmpty()) return "user";
        return roles.iterator().next().name().toLowerCase();
    }
    
    public java.util.List<String> getAllRoles() {
        if (roles == null) return java.util.Arrays.asList("user");
        return roles.stream().map(r -> r.name().toLowerCase()).toList();
    }
} 