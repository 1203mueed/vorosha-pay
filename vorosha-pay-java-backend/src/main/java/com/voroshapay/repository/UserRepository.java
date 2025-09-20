package com.voroshapay.repository;

import com.voroshapay.entity.User;
import com.voroshapay.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r = :role")
    List<User> findByRole(UserRole role);
    
    @Query("SELECT u FROM User u JOIN u.roles r WHERE r IN :roles")
    List<User> findByRoleIn(List<UserRole> roles);
} 