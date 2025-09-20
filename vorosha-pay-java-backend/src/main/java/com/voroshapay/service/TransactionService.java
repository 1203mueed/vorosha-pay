package com.voroshapay.service;

import com.voroshapay.entity.Transaction;
import com.voroshapay.entity.TransactionStatus;
import com.voroshapay.entity.User;
import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private UserService userService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private BkashService bkashService;

    private Transaction mapToTransaction(Map<String, String> row) {
        if (row == null) return null;
        Transaction t = new Transaction();
        t.setId(Long.parseLong(row.get("id")));
        t.setTransactionId(row.get("transactionId"));
        t.setBuyerId(Long.parseLong(row.get("buyerId")));
        t.setSellerId(Long.parseLong(row.get("sellerId")));
        t.setAmount(new BigDecimal(Optional.ofNullable(row.get("amount")).orElse("0")));
        t.setDescription(row.get("description"));
        try { t.setStatus(TransactionStatus.valueOf(row.get("status").toUpperCase())); } catch (Exception e) { t.setStatus(TransactionStatus.PENDING); }
        t.setPaymentMethod(row.get("paymentMethod"));
        t.setDeliveryProof(row.get("deliveryProof"));
        String due = row.get("dueDate");
        t.setDueDate(due == null || due.isEmpty() ? null : LocalDateTime.parse(due));
        t.setNotes(row.get("notes"));
        t.setServiceChargePaymentOption(row.get("serviceChargePaymentOption"));
        String serviceFee = row.get("serviceFee");
        t.setServiceFee(serviceFee == null || serviceFee.isEmpty() ? null : new BigDecimal(serviceFee));
        String totalAmount = row.get("totalAmount");
        t.setTotalAmount(totalAmount == null || totalAmount.isEmpty() ? null : new BigDecimal(totalAmount));
        String created = row.get("createdAt");
        t.setCreatedAt(created == null || created.isEmpty() ? null : LocalDateTime.parse(created));
        String updated = row.get("updatedAt");
        t.setUpdatedAt(updated == null || updated.isEmpty() ? null : LocalDateTime.parse(updated));
        String comp = row.get("completedAt");
        t.setCompletedAt(comp == null || comp.isEmpty() ? null : LocalDateTime.parse(comp));
        return t;
    }    // New method to create enriched transaction DTOs
    private Map<String, Object> createTransactionDTO(Transaction transaction) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", transaction.getId());
        dto.put("transactionId", transaction.getTransactionId());
        dto.put("amount", transaction.getAmount());
        dto.put("description", transaction.getDescription());
        dto.put("status", transaction.getStatus().name().toLowerCase());
        dto.put("paymentMethod", transaction.getPaymentMethod());
        dto.put("deliveryProof", transaction.getDeliveryProof());
        dto.put("dueDate", transaction.getDueDate());
        dto.put("notes", transaction.getNotes());
        dto.put("serviceChargePaymentOption", transaction.getServiceChargePaymentOption());
        dto.put("serviceFee", transaction.getServiceFee());
        dto.put("totalAmount", transaction.getTotalAmount());
        dto.put("createdAt", transaction.getCreatedAt());
        dto.put("updatedAt", transaction.getUpdatedAt());
        dto.put("completedAt", transaction.getCompletedAt());
        
        // Enrich with buyer and seller information
        try {
            Optional<User> buyer = userService.findById(transaction.getBuyerId());
            if (buyer.isPresent()) {
                Map<String, Object> buyerInfo = new HashMap<>();
                buyerInfo.put("id", buyer.get().getId());
                buyerInfo.put("fullName", buyer.get().getFullName());
                buyerInfo.put("email", buyer.get().getEmail());
                dto.put("buyer", buyerInfo);
            }
        } catch (Exception e) {
            // If buyer not found, set null
            dto.put("buyer", null);
        }
        
        try {
            Optional<User> seller = userService.findById(transaction.getSellerId());
            if (seller.isPresent()) {
                Map<String, Object> sellerInfo = new HashMap<>();
                sellerInfo.put("id", seller.get().getId());
                sellerInfo.put("fullName", seller.get().getFullName());
                sellerInfo.put("email", seller.get().getEmail());
                dto.put("seller", sellerInfo);
            }
        } catch (Exception e) {
            // If seller not found, set null
            dto.put("seller", null);
        }
        
        return dto;
    }

    public Transaction createTransaction(Long buyerId, Long sellerId, BigDecimal amount, String description, String paymentMethod, LocalDateTime dueDate, String notes, String serviceChargePaymentOption) {
        String transactionId = excel.generateTransactionId();
        LocalDateTime now = LocalDateTime.now();
        
        // Calculate service fee and total amount based on payment option
        BigDecimal serviceFee = amount.multiply(new BigDecimal("0.02")); // 2% service fee
        BigDecimal totalAmount;
        
        switch (serviceChargePaymentOption) {
            case "BUYER_PAYS":
                totalAmount = amount.add(serviceFee);
                break;
            case "SPLIT":
                totalAmount = amount.add(serviceFee.divide(new BigDecimal("2")));
                break;
            case "SELLER_PAYS":
                totalAmount = amount;
                break;
            default:
                throw new RuntimeException("Invalid service charge payment option: " + serviceChargePaymentOption);
        }
        
        Map<String, String> data = new HashMap<>();
        data.put("transactionId", transactionId);
        data.put("buyerId", String.valueOf(buyerId));
        data.put("sellerId", String.valueOf(sellerId));
        data.put("amount", amount.toPlainString());
        data.put("description", description);
        data.put("status", TransactionStatus.PENDING.name());
        // Do not set paymentMethod at creation; it will be set when buyer funds the transaction
        data.put("paymentMethod", "");
        data.put("dueDate", dueDate == null ? "" : dueDate.toString());
        data.put("notes", notes == null ? "" : notes);
        data.put("serviceChargePaymentOption", serviceChargePaymentOption);
        data.put("serviceFee", serviceFee.toPlainString());
        data.put("totalAmount", totalAmount.toPlainString());
        data.put("createdAt", now.toString());
        data.put("updatedAt", now.toString());
        Map<String, String> created = excel.create("transactions", data);
        return mapToTransaction(created);
    }

    public List<Map<String, Object>> findEnrichedByUserId(Long userId) {
        return findEnrichedByUserId(userId, null, null, null, "newest");
    }
    
    public List<Map<String, Object>> findEnrichedByUserId(Long userId, String status, Integer limit, Integer page, String sort) {
        List<Map<String, String>> list = excel.findAll("transactions");
        List<Map<String, Object>> out = new ArrayList<>();
        
        for (Map<String, String> r : list) {
            if (Objects.equals(r.get("buyerId"), String.valueOf(userId)) || Objects.equals(r.get("sellerId"), String.valueOf(userId))) {
                Transaction transaction = mapToTransaction(r);
                
                // Apply status filter
                if (status != null && !status.isEmpty() && !status.equals("all")) {
                    if (!transaction.getStatus().name().toLowerCase().equals(status.toLowerCase())) {
                        continue;
                    }
                }
                
                Map<String, Object> dto = createTransactionDTO(transaction);
                // Add user role information
                if (Objects.equals(r.get("buyerId"), String.valueOf(userId))) {
                    dto.put("userRole", "buyer");
                } else {
                    dto.put("userRole", "seller");
                }
                out.add(dto);
            }
        }
        
        // Apply sorting
        out.sort((a, b) -> {
            Object createdAtA = a.get("createdAt");
            Object createdAtB = b.get("createdAt");
            
            if (createdAtA == null || createdAtB == null) {
                return 0;
            }
            
            try {
                LocalDateTime dateA, dateB;
                
                // Handle different date formats
                if (createdAtA instanceof LocalDateTime) {
                    dateA = (LocalDateTime) createdAtA;
                } else {
                    dateA = LocalDateTime.parse(createdAtA.toString());
                }
                
                if (createdAtB instanceof LocalDateTime) {
                    dateB = (LocalDateTime) createdAtB;
                } else {
                    dateB = LocalDateTime.parse(createdAtB.toString());
                }
                
                if ("newest".equals(sort) || "desc".equals(sort)) {
                    return dateB.compareTo(dateA); // Newest first
                } else if ("oldest".equals(sort) || "asc".equals(sort)) {
                    return dateA.compareTo(dateB); // Oldest first
                } else {
                    return dateB.compareTo(dateA); // Default to newest first
                }
            } catch (Exception e) {
                System.err.println("Error parsing dates for sorting: " + e.getMessage());
                System.err.println("createdAtA: " + createdAtA + ", createdAtB: " + createdAtB);
                return 0;
            }
        });
        
        // Apply pagination
        if (limit != null && limit > 0) {
            int startIndex = (page != null && page > 0) ? (page - 1) * limit : 0;
            int endIndex = Math.min(startIndex + limit, out.size());
            if (startIndex < out.size()) {
                out = out.subList(startIndex, endIndex);
            } else {
                out = new ArrayList<>();
            }
        }
        
        return out;
    }

    public List<Transaction> findByUserId(Long userId) {
        List<Map<String, String>> list = excel.findAll("transactions");
        List<Transaction> out = new ArrayList<>();
        for (Map<String, String> r : list) {
            if (Objects.equals(r.get("buyerId"), String.valueOf(userId)) || Objects.equals(r.get("sellerId"), String.valueOf(userId))) {
                out.add(mapToTransaction(r));
            }
        }
        return out;
    }

    public Transaction findByIdAndUserId(Long id, Long userId) {
        Map<String, String> row = excel.findById("transactions", id);
        Transaction t = mapToTransaction(row);
        if (t == null) throw new RuntimeException("Transaction not found");
        if (!Objects.equals(t.getBuyerId(), userId) && !Objects.equals(t.getSellerId(), userId)) throw new RuntimeException("Access denied");
        
        // Check if user needs verification to access this transaction
        User user = userService.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.needsVerification()) {
            throw new RuntimeException("VERIFICATION_REQUIRED");
        }
        
        return t;
    }
    
    public Transaction findByIdAndUserId(String transactionId, Long userId) {
        return findByTransactionIdAndUserId(transactionId, userId);
    }

    public Map<String, Object> findEnrichedByIdAndUserId(Long id, Long userId) {
        Transaction transaction = findByIdAndUserId(id, userId);
        Map<String, Object> dto = createTransactionDTO(transaction);
        // Add user role information
        if (Objects.equals(transaction.getBuyerId(), userId)) {
            dto.put("userRole", "buyer");
        } else {
            dto.put("userRole", "seller");
        }
        return dto;
    }

    public Transaction findByTransactionIdAndUserId(String transactionId, Long userId) {
        Map<String, String> row = excel.findOne("transactions", Map.of("transactionId", transactionId));
        Transaction t = mapToTransaction(row);
        if (t == null) throw new RuntimeException("Transaction not found");
        if (!Objects.equals(t.getBuyerId(), userId) && !Objects.equals(t.getSellerId(), userId)) throw new RuntimeException("Access denied");
        return t;
    }

    private Transaction saveStatus(Transaction t, TransactionStatus status) {
        System.out.println("Saving transaction " + t.getId() + " with status change to: " + status);
        
        t.setStatus(status);
        LocalDateTime now = LocalDateTime.now();
        t.setUpdatedAt(now);
        if (status == TransactionStatus.COMPLETED) {
            t.setCompletedAt(now);
        }
        
        Map<String, String> data = new HashMap<>();
        data.put("transactionId", t.getTransactionId());
        data.put("buyerId", String.valueOf(t.getBuyerId()));
        data.put("sellerId", String.valueOf(t.getSellerId()));
        data.put("amount", t.getAmount().toPlainString());
        data.put("description", t.getDescription());
        data.put("status", t.getStatus().name());
        data.put("paymentMethod", t.getPaymentMethod());
        data.put("deliveryProof", t.getDeliveryProof() == null ? "" : t.getDeliveryProof());
        data.put("dueDate", t.getDueDate() == null ? "" : t.getDueDate().toString());
        data.put("notes", t.getNotes() == null ? "" : t.getNotes());
        data.put("createdAt", t.getCreatedAt() == null ? "" : t.getCreatedAt().toString());
        data.put("updatedAt", t.getUpdatedAt() == null ? "" : t.getUpdatedAt().toString());
        data.put("completedAt", t.getCompletedAt() == null ? "" : t.getCompletedAt().toString());
        
        System.out.println("Updating Excel with data: " + data);
        
        try {
            Map<String, String> updated = excel.update("transactions", t.getId(), data);
            System.out.println("Excel update successful, updated data: " + updated);
            
            // Send notifications based on status change
            try {
                sendStatusChangeNotifications(t, status);
            } catch (Exception e) {
                System.err.println("Notification failed but continuing: " + e.getMessage());
            }
            
            return mapToTransaction(updated);
        } catch (Exception e) {
            System.err.println("Excel update failed: " + e.getMessage());
            throw new RuntimeException("Failed to update transaction status: " + e.getMessage(), e);
        }
    }
    
    private void sendStatusChangeNotifications(Transaction t, TransactionStatus status) {
        String description = t.getDescription();
        String transactionId = t.getTransactionId();
        
        switch (status) {
            case PENDING:
                // No notification needed for initial pending state
                break;
            case ACCEPTED:
                notificationService.createNotification(t.getBuyerId(), "info", "Transaction Accepted", 
                    "Seller has accepted your transaction: " + description + " (ID: " + transactionId + "). Please make payment to escrow.");
                notificationService.createNotification(t.getSellerId(), "success", "Transaction Accepted", 
                    "You have accepted the transaction: " + description + " (ID: " + transactionId + "). Awaiting buyer payment.");
                break;
            case FUNDED:
                notificationService.createNotification(t.getSellerId(), "info", "Payment Received", 
                    "Buyer has made payment for transaction: " + description + " (ID: " + transactionId + "). Please deliver the goods/service.");
                notificationService.createNotification(t.getBuyerId(), "success", "Payment Sent", 
                    "Your payment has been sent to escrow for transaction: " + description + " (ID: " + transactionId + "). Awaiting delivery.");
                break;
            case DELIVERED:
                notificationService.createNotification(t.getBuyerId(), "info", "Delivery Completed", 
                    "Seller has marked transaction as delivered: " + description + " (ID: " + transactionId + "). Please confirm if you received it.");
                notificationService.createNotification(t.getSellerId(), "success", "Delivery Marked", 
                    "You have marked the transaction as delivered: " + description + " (ID: " + transactionId + "). Awaiting buyer confirmation.");
                break;
            case COMPLETED:
                notificationService.createNotification(t.getSellerId(), "success", "Transaction Completed", 
                    "Transaction completed! Payment released for: " + description + " (ID: " + transactionId + ").");
                notificationService.createNotification(t.getBuyerId(), "success", "Transaction Completed", 
                    "Transaction completed successfully: " + description + " (ID: " + transactionId + ").");
                break;
            case CANCELLED:
                notificationService.createNotification(t.getBuyerId(), "warning", "Transaction Cancelled", 
                    "Transaction has been cancelled: " + description + " (ID: " + transactionId + ").");
                notificationService.createNotification(t.getSellerId(), "warning", "Transaction Cancelled", 
                    "Transaction has been cancelled: " + description + " (ID: " + transactionId + ").");
                break;
            case DISPUTED:
                notificationService.createNotification(t.getBuyerId(), "warning", "Dispute Filed", 
                    "A dispute has been filed for transaction: " + description + " (ID: " + transactionId + "). Admin will review.");
                notificationService.createNotification(t.getSellerId(), "warning", "Dispute Filed", 
                    "A dispute has been filed for transaction: " + description + " (ID: " + transactionId + "). Admin will review.");
                break;
        }
    }

    public Transaction acceptTransaction(Long id, Long userId) {
        Transaction t = findByIdAndUserId(id, userId);
        if (!Objects.equals(t.getSellerId(), userId) || t.getStatus() != TransactionStatus.PENDING) throw new RuntimeException("Cannot accept this transaction");
        return saveStatus(t, TransactionStatus.ACCEPTED);
    }

    public Transaction fundTransaction(Long id, Long userId, String paymentMethod) {
        Transaction t = findByIdAndUserId(id, userId);
        if (!Objects.equals(t.getBuyerId(), userId) || t.getStatus() != TransactionStatus.ACCEPTED) throw new RuntimeException("Cannot fund this transaction");
        // Set the payment method when funding
        if (paymentMethod != null && !paymentMethod.trim().isEmpty()) {
            t.setPaymentMethod(paymentMethod);
        }
        
        // For bKash, the funding happens during authorization, so we directly mark as funded
        // The actual payment authorization was already done in the payment flow
        
        return saveStatus(t, TransactionStatus.FUNDED);
    }

    public Transaction deliverTransaction(Long id, Long userId, String deliveryProof) {
        System.out.println("Delivering transaction " + id + " for user " + userId + " with proof: " + deliveryProof);
        
        Transaction t = findByIdAndUserId(id, userId);
        if (t == null) {
            throw new RuntimeException("Transaction not found");
        }
        
        System.out.println("Transaction found: " + t.getTransactionId() + ", status: " + t.getStatus() + ", seller: " + t.getSellerId());
        
        if (!Objects.equals(t.getSellerId(), userId)) {
            throw new RuntimeException("Only the seller can deliver this transaction");
        }
        
        if (t.getStatus() != TransactionStatus.FUNDED) {
            throw new RuntimeException("Transaction must be funded before delivery. Current status: " + t.getStatus());
        }
        
        t.setDeliveryProof(deliveryProof);
        Transaction result = saveStatus(t, TransactionStatus.DELIVERED);
        System.out.println("Transaction delivered successfully, new status: " + result.getStatus());
        return result;
    }

    public Transaction completeTransaction(Long id, Long userId) {
        Transaction t = findByIdAndUserId(id, userId);
        if (!Objects.equals(t.getBuyerId(), userId) || t.getStatus() != TransactionStatus.DELIVERED) throw new RuntimeException("Cannot complete this transaction");
        t.setCompletedAt(LocalDateTime.now());
        
        // Auto-capture bKash payment if payment method is bkash
        if ("bkash".equalsIgnoreCase(t.getPaymentMethod())) {
            try {
                Map<String, Object> captureResult = bkashService.autoCaptureOnCompletion(id);
                if (!(Boolean) captureResult.get("success")) {
                    System.err.println("bKash auto-capture failed for transaction " + id + ": " + captureResult.get("message"));
                    // Continue with transaction completion even if capture fails
                }
            } catch (Exception e) {
                System.err.println("Error during bKash auto-capture for transaction " + id + ": " + e.getMessage());
                // Continue with transaction completion even if capture fails
            }
        }
        
        return saveStatus(t, TransactionStatus.COMPLETED);
    }

    public Transaction cancelTransaction(Long id, Long userId, String reason) {
        Transaction t = findByIdAndUserId(id, userId);
        if (!(Objects.equals(t.getBuyerId(), userId) || Objects.equals(t.getSellerId(), userId)) || !(t.getStatus() == TransactionStatus.PENDING || t.getStatus() == TransactionStatus.ACCEPTED)) throw new RuntimeException("Cannot cancel this transaction");
        String notes = (t.getNotes() == null ? "" : t.getNotes()) + (reason == null ? "" : ("\nCancellation reason: " + reason));
        t.setNotes(notes);
        return saveStatus(t, TransactionStatus.CANCELLED);
    }

    public Transaction disputeTransaction(Long id, Long userId, String reason) {
        Transaction t = findByIdAndUserId(id, userId);
        String notes = (t.getNotes() == null ? "" : t.getNotes()) + (reason == null ? "" : ("\nDispute reason: " + reason));
        t.setNotes(notes);
        return saveStatus(t, TransactionStatus.DISPUTED);
    }

    public Map<String, Object> getUserStats(Long userId) {
        List<Transaction> all = findByUserId(userId);
        long total = all.size();
        long completed = all.stream().filter(t -> t.getStatus() == TransactionStatus.COMPLETED).count();
        long pending = all.stream().filter(t -> t.getStatus() == TransactionStatus.PENDING).count();
        long disputed = all.stream().filter(t -> t.getStatus() == TransactionStatus.DISPUTED).count();
        Map<String, Object> m = new HashMap<>();
        m.put("totalTransactions", total);
        m.put("completedTransactions", completed);
        m.put("pendingTransactions", pending);
        m.put("disputedTransactions", disputed);
        return m;
    }
} 