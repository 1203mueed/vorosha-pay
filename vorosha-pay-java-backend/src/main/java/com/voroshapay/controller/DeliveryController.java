package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.UserService;
import com.voroshapay.service.TransactionService;
import com.voroshapay.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/delivery")
@CrossOrigin(origins = "${app.frontend.url}")
public class DeliveryController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private TransactionService transactionService;

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

    @PostMapping("/transactions/{transactionId}/deliver")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadDeliveryPhotos(
            HttpServletRequest request,
            @PathVariable String transactionId,
            @RequestParam("photos") MultipartFile[] photos,
            @RequestParam(value = "deliveryNotes", required = false) String deliveryNotes) {
        try {
            User user = getCurrentUser(request);
            
            // Create upload directory
            Path uploadDir = Paths.get("uploads", "delivery_photo");
            Files.createDirectories(uploadDir);
            
            List<String> uploadedFiles = new ArrayList<>();
            
            for (MultipartFile photo : photos) {
                if (!photo.isEmpty()) {
                    String filename = "delivery-" + System.currentTimeMillis() + "-" + photo.getOriginalFilename();
                    Path filePath = uploadDir.resolve(filename);
                    Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                    uploadedFiles.add(filename);
                }
            }
            
            // Update transaction status to DELIVERED with delivery proof
            String deliveryProof = String.join(",", uploadedFiles);
            if (deliveryNotes != null && !deliveryNotes.trim().isEmpty()) {
                deliveryProof += "|NOTES:" + deliveryNotes;
            }
            
            // Convert transactionId to Long if it's numeric, otherwise use the string
            Long transactionIdLong;
            try {
                transactionIdLong = Long.parseLong(transactionId);
            } catch (NumberFormatException e) {
                // If not numeric, find by transactionId string
                var transaction = transactionService.findByTransactionIdAndUserId(transactionId, user.getId());
                if (transaction == null) {
                    throw new RuntimeException("Transaction not found or access denied");
                }
                transactionIdLong = transaction.getId();
            }
            
            transactionService.deliverTransaction(transactionIdLong, user.getId(), deliveryProof);
            
            Map<String, Object> result = new HashMap<>();
            result.put("transactionId", transactionId);
            result.put("uploadedFiles", uploadedFiles);
            result.put("status", "delivered");
            result.put("deliveryNotes", deliveryNotes);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Delivery photos uploaded and transaction marked as delivered", result));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Failed to upload photos: " + e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/transactions/{transactionId}/confirm")
    public ResponseEntity<ApiResponse<Map<String, Object>>> confirmDelivery(
            HttpServletRequest request,
            @PathVariable String transactionId) {
        try {
            User user = getCurrentUser(request);
            
            // Validate user has permission to confirm delivery for this transaction
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            // This should be implemented based on business logic
            
            Map<String, Object> result = new HashMap<>();
            result.put("transactionId", transactionId);
            result.put("status", "confirmed");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Delivery confirmed", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/transactions/{transactionId}/delivery")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeliveryDetails(
            HttpServletRequest request,
            @PathVariable String transactionId) {
        try {
            User user = getCurrentUser(request);
            
            // Find the transaction
            var transaction = transactionService.findByTransactionIdAndUserId(transactionId, user.getId());
            if (transaction == null) {
                throw new RuntimeException("Transaction not found or access denied");
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("transactionId", transactionId);
            result.put("status", transaction.getStatus().toString().toLowerCase());
            
            // Parse delivery proof to extract photos and notes
            String deliveryProof = transaction.getDeliveryProof();
            List<String> deliveryPhotos = new ArrayList<>();
            String deliveryNotes = null;
            
            if (deliveryProof != null && !deliveryProof.trim().isEmpty()) {
                if (deliveryProof.contains("|NOTES:")) {
                    String[] parts = deliveryProof.split("\\|NOTES:");
                    String photosPart = parts[0];
                    deliveryNotes = parts.length > 1 ? parts[1] : null;
                    if (!photosPart.isEmpty()) {
                        deliveryPhotos = Arrays.asList(photosPart.split(","));
                    }
                } else {
                    deliveryPhotos = Arrays.asList(deliveryProof.split(","));
                }
            }
            
            result.put("deliveryPhotos", deliveryPhotos);
            result.put("deliveryNotes", deliveryNotes);
            result.put("deliveredAt", transaction.getUpdatedAt());
            result.put("isConfirmed", transaction.getStatus().toString().equals("COMPLETED"));
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Delivery details retrieved", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/photos/{filename}")
    public ResponseEntity<byte[]> getDeliveryPhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get("uploads", "delivery_photo", filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            byte[] bytes = Files.readAllBytes(filePath);
            return ResponseEntity.ok()
                    .header("Content-Type", "image/jpeg")
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my-deliveries")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserDeliveries(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            
            // Get deliveries for the current user
            if (user == null) {
                throw new RuntimeException("User not authenticated");
            }
            // This should be implemented based on business logic
            
            // Return empty list for demo
            List<Map<String, Object>> deliveries = new ArrayList<>();
            
            return ResponseEntity.ok(new ApiResponse<>(true, "User deliveries retrieved", deliveries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}