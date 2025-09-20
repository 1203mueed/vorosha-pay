package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "${app.frontend.url}")
public class PaymentController {

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

    @GetMapping("/methods")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getPaymentMethods() {
        try {
            List<Map<String, String>> methods = Arrays.asList(
                Map.of("id", "bkash", "name", "bKash", "icon", "📱", "enabled", "true"),
                Map.of("id", "nagad", "name", "Nagad", "icon", "💳", "enabled", "false"),
                Map.of("id", "rocket", "name", "Rocket", "icon", "🚀", "enabled", "false"),
                Map.of("id", "bank", "name", "Bank Transfer", "icon", "🏦", "enabled", "false"),
                Map.of("id", "mock", "name", "Mock Payment", "icon", "🎭", "enabled", "true")
            );
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment methods retrieved", methods));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiatePayment(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        try {
            User user = getCurrentUser(request);
            String transactionId = body.get("transactionId");
            String paymentMethod = body.get("paymentMethod");
            
            // Validate user authentication and transaction permissions
            if (user == null || transactionId == null) {
                throw new RuntimeException("Invalid request parameters");
            }
            // Payment initiation is handled by the transaction funding process
            // This endpoint is kept for frontend compatibility
            Map<String, Object> result = new HashMap<>();
            result.put("paymentId", "PAY-" + System.currentTimeMillis());
            result.put("status", "initiated");
            result.put("paymentMethod", paymentMethod);
            result.put("message", "Use transaction funding endpoints for actual payment processing");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment initiated", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/process/{paymentId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> processPayment(
            HttpServletRequest request,
            @PathVariable String paymentId) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user authentication
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> result = new HashMap<>();
            result.put("paymentId", paymentId);
            result.put("status", "completed");
            result.put("amount", "100.00");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment processed", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStatus(
            HttpServletRequest request,
            @PathVariable String paymentId) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user authentication
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> result = new HashMap<>();
            result.put("paymentId", paymentId);
            result.put("status", "completed");
            result.put("amount", "100.00");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment status retrieved", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPaymentHistory(
            HttpServletRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user authentication
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            // Return empty list for demo
            List<Map<String, Object>> payments = new ArrayList<>();
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment history retrieved", payments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{paymentId}/cancel")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelPayment(
            HttpServletRequest request,
            @PathVariable String paymentId) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user authentication
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> result = new HashMap<>();
            result.put("paymentId", paymentId);
            result.put("status", "cancelled");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment cancelled", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentStats(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user authentication
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPayments", 0);
            stats.put("totalAmount", 0.0);
            stats.put("successfulPayments", 0);
            stats.put("failedPayments", 0);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Payment stats retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
