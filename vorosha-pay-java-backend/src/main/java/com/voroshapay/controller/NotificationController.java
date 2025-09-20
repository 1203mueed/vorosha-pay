package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.NotificationService;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "${app.frontend.url}")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    private User getCurrentUser(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = auth.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }
        Long userId = jwtUtil.getUserIdFromToken(token);
        return userService.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getMyNotifications(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "User not found", null));
            }
            
            List<Map<String, String>> list = notificationService.getUserNotifications(user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Notifications retrieved successfully", list));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized") || e.getMessage().contains("Invalid token")) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Authentication failed", null));
            }
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, String>>> markRead(HttpServletRequest request, @PathVariable Long id) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "User not found", null));
            }
            
            Map<String, String> row = notificationService.markRead(id);
            if (row == null) {
                return ResponseEntity.status(404).body(new ApiResponse<>(false, "Notification not found", null));
            }
            
            if (!String.valueOf(user.getId()).equals(row.get("userId"))) {
                return ResponseEntity.status(403).body(new ApiResponse<>(false, "Access denied", null));
            }
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Notification marked as read", row));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized") || e.getMessage().contains("Invalid token")) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Authentication failed", null));
            }
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null));
        }
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, String>>> createTestNotification(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "User not found", null));
            }
            
            Map<String, String> notification = notificationService.createNotification(
                user.getId(), 
                "test", 
                "Test Notification", 
                "This is a test notification to verify the system is working"
            );
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Test notification created", notification));
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized") || e.getMessage().contains("Invalid token")) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "Authentication failed", null));
            }
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null));
        }
    }
} 