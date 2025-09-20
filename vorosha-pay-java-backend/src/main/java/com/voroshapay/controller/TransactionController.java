package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.Transaction;
import com.voroshapay.entity.User;
import com.voroshapay.service.TransactionService;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.voroshapay.service.NotificationService;
import java.util.HashMap;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "${app.frontend.url}")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

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
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTransactions(
            HttpServletRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false, defaultValue = "newest") String sort) {
        try {
            User user = getCurrentUser(request);
            List<Map<String, Object>> transactions = transactionService.findEnrichedByUserId(
                user.getId(), status, limit, page, sort);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transactions retrieved", transactions));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Transaction>> createTransaction(
            HttpServletRequest request,
            @RequestBody Map<String, Object> req) {
        try {
            User user = getCurrentUser(request);
            
            // Check if user is fully verified to create transactions
            if (user.needsVerification()) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "VERIFICATION_REQUIRED", null));
            }

            // Accept either sellerId or counterpartyEmail
            Long sellerId = null;
            Object sellerIdRaw = req.get("sellerId");
            if (sellerIdRaw != null) {
                sellerId = Long.valueOf(sellerIdRaw.toString());
            } else if (req.get("counterpartyEmail") != null) {
                String email = String.valueOf(req.get("counterpartyEmail")).trim();
                User seller = userService.findByEmail(email).orElseThrow(() -> new RuntimeException("Counterparty not found"));
                sellerId = seller.getId();
            } else {
                throw new RuntimeException("sellerId or counterpartyEmail is required");
            }

            BigDecimal amount = new BigDecimal(req.get("amount").toString());
            String description = req.get("description").toString();
            // paymentMethod must NOT be set at creation; it will be chosen by buyer at funding time
            String paymentMethod = null;
            String notes = (String) req.getOrDefault("notes", "");
            String serviceChargePaymentOption = (String) req.getOrDefault("serviceChargePaymentOption", "BUYER_PAYS");

            LocalDateTime dueDate = null;
            if (req.get("dueDate") != null) {
                String dueStr = req.get("dueDate").toString();
                // Support both date-only (YYYY-MM-DD) and ISO datetime
                if (dueStr.length() == 10 && dueStr.charAt(4) == '-' && dueStr.charAt(7) == '-') {
                    dueDate = java.time.LocalDate.parse(dueStr).atStartOfDay();
                } else {
                    dueDate = LocalDateTime.parse(dueStr);
                }
            }

            Transaction transaction = transactionService.createTransaction(
                user.getId(), sellerId, amount, description, paymentMethod, dueDate, notes, serviceChargePaymentOption);

            // Create notifications for both buyer and seller
            try {
                notificationService.createNotification(sellerId, "info", "New transaction awaiting your acceptance", "A buyer has created a transaction: " + description);
                notificationService.createNotification(user.getId(), "success", "Transaction created", "Your transaction has been created and is pending seller acceptance.");
            } catch (Exception ignore) {}

            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction created successfully", transaction));
        } catch (Exception e) {
            // Check if it's a verification error
            if (e.getMessage().contains("VERIFICATION_REQUIRED")) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "VERIFICATION_REQUIRED", null));
            }
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            Map<String, Object> stats = transactionService.getUserStats(user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Statistics retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransaction(
            HttpServletRequest request,
            @PathVariable Long id) {
        try {
            User user = getCurrentUser(request);
            Map<String, Object> transaction = transactionService.findEnrichedByIdAndUserId(id, user.getId());
            Map<String, Object> payload = new HashMap<>();
            payload.put("transaction", transaction);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction retrieved", payload));
        } catch (Exception e) {
            // Check if it's a verification error
            if (e.getMessage().contains("VERIFICATION_REQUIRED")) {
                return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "VERIFICATION_REQUIRED", null));
            }
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/ref/{transactionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactionByRef(
            HttpServletRequest request,
            @PathVariable String transactionId) {
        try {
            User user = getCurrentUser(request);
            Transaction transaction = transactionService.findByTransactionIdAndUserId(transactionId, user.getId());
            Map<String, Object> dto = new HashMap<>();
            // reuse service to enrich by id
            Map<String, Object> enriched = transactionService.findEnrichedByIdAndUserId(transaction.getId(), user.getId());
            dto.put("transaction", enriched);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction retrieved", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<Transaction>> acceptTransaction(
            HttpServletRequest request,
            @PathVariable Long id) {
        try {
            User user = getCurrentUser(request);
            Transaction transaction = transactionService.acceptTransaction(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction accepted", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/fund")
    public ResponseEntity<ApiResponse<Transaction>> fundTransaction(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        try {
            User user = getCurrentUser(request);
            String paymentMethod = req.get("paymentMethod");
            Transaction transaction = transactionService.fundTransaction(id, user.getId(), paymentMethod);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction funded", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/deliver")
    public ResponseEntity<ApiResponse<Transaction>> deliverTransaction(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                return ResponseEntity.status(401).body(new ApiResponse<>(false, "User not found", null));
            }
            
            String deliveryProof = req.get("deliveryProof");
            System.out.println("Delivering transaction " + id + " for user " + user.getId() + " with proof: " + deliveryProof);
            
            Transaction transaction = transactionService.deliverTransaction(id, user.getId(), deliveryProof);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction marked as delivered", transaction));
        } catch (RuntimeException e) {
            System.err.println("Delivery error: " + e.getMessage());
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            System.err.println("Unexpected delivery error: " + e.getMessage());
            return ResponseEntity.internalServerError()
                .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<Transaction>> completeTransaction(
            HttpServletRequest request,
            @PathVariable Long id) {
        try {
            User user = getCurrentUser(request);
            Transaction transaction = transactionService.completeTransaction(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction completed", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Transaction>> cancelTransaction(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        try {
            User user = getCurrentUser(request);
            String reason = req.get("reason");
            Transaction transaction = transactionService.cancelTransaction(id, user.getId(), reason);
            return ResponseEntity.ok(new ApiResponse<>(true, "Transaction cancelled", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/dispute")
    public ResponseEntity<ApiResponse<Transaction>> disputeTransaction(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> req) {
        try {
            User user = getCurrentUser(request);
            String reason = req.get("reason");
            Transaction transaction = transactionService.disputeTransaction(id, user.getId(), reason);
            return ResponseEntity.ok(new ApiResponse<>(true, "Dispute filed for transaction", transaction));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
} 