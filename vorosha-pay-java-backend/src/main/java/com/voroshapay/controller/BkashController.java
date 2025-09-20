package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.BkashService;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bkash")
@CrossOrigin(origins = "${app.frontend.url}")
public class BkashController {

    @Autowired
    private BkashService bkashService;

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

    /**
     * Grant Token - Get access token for bKash API
     */
    @PostMapping("/grant-token")
    public ResponseEntity<ApiResponse<Map<String, Object>>> grantToken(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> result = bkashService.grantToken();
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Token granted successfully", result));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, (String) result.get("message"), result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Create Payment (Authorization Phase) - Authorize payment without capturing funds
     */
    @PostMapping("/create-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPayment(
            HttpServletRequest request,
            @RequestBody Map<String, String> paymentRequest) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            
            String idToken = paymentRequest.get("idToken");
            String amount = paymentRequest.get("amount");
            String customerMsisdn = paymentRequest.get("customerMsisdn");
            String merchantInvoiceNumber = paymentRequest.get("merchantInvoiceNumber");
            String transactionId = paymentRequest.get("transactionId");

            if (idToken == null || amount == null || customerMsisdn == null || 
                merchantInvoiceNumber == null || transactionId == null) {
                return ResponseEntity.badRequest().body(
                    new ApiResponse<>(false, "Missing required fields", null));
            }

            Map<String, Object> result = bkashService.createPayment(
                idToken, amount, customerMsisdn, merchantInvoiceNumber, transactionId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Payment authorization created successfully", result));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, (String) result.get("message"), result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Execute Payment (Capture Phase) - Capture previously authorized funds
     */
    @PostMapping("/execute-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> executePayment(
            HttpServletRequest request,
            @RequestBody Map<String, String> executeRequest) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            
            String idToken = executeRequest.get("idToken");
            String paymentId = executeRequest.get("paymentId");

            if (idToken == null || paymentId == null) {
                return ResponseEntity.badRequest().body(
                    new ApiResponse<>(false, "Missing required fields: idToken and paymentId", null));
            }

            Map<String, Object> result = bkashService.executePayment(idToken, paymentId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Payment captured successfully", result));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, (String) result.get("message"), result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Query Payment Status
     */
    @PostMapping("/query-payment")
    public ResponseEntity<ApiResponse<Map<String, Object>>> queryPayment(
            HttpServletRequest request,
            @RequestBody Map<String, String> queryRequest) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            
            String idToken = queryRequest.get("idToken");
            String paymentId = queryRequest.get("paymentId");

            if (idToken == null || paymentId == null) {
                return ResponseEntity.badRequest().body(
                    new ApiResponse<>(false, "Missing required fields: idToken and paymentId", null));
            }

            Map<String, Object> result = bkashService.queryPayment(idToken, paymentId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Payment status retrieved successfully", result));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, (String) result.get("message"), result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Get Authorized Transactions (pending capture)
     */
    @GetMapping("/authorized-transactions")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAuthorizedTransactions(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            List<Map<String, String>> transactions = bkashService.getAuthorizedTransactions();
            return ResponseEntity.ok(new ApiResponse<>(true, "Authorized transactions retrieved", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Get Captured Transactions (completed)
     */
    @GetMapping("/captured-transactions")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getCapturedTransactions(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            List<Map<String, String>> transactions = bkashService.getCapturedTransactions();
            return ResponseEntity.ok(new ApiResponse<>(true, "Captured transactions retrieved", transactions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    /**
     * Auto-capture payment when transaction is completed
     */
    @PostMapping("/auto-capture/{transactionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> autoCapturePayment(
            HttpServletRequest request,
            @PathVariable Long transactionId) {
        try {
            User user = getCurrentUser(request);
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            Map<String, Object> result = bkashService.autoCaptureOnCompletion(transactionId);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(new ApiResponse<>(true, "Payment captured successfully", result));
            } else {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, (String) result.get("message"), result));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
} 