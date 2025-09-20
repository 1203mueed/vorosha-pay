package com.voroshapay.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Transaction {
    
    private Long id;
    private String transactionId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal amount;
    private String description;
    private TransactionStatus status = TransactionStatus.PENDING;
    private String paymentMethod;
    private String deliveryProof;
    private LocalDateTime dueDate;
    private String notes;
    private String serviceChargePaymentOption; // BUYER_PAYS, SPLIT, SELLER_PAYS
    private BigDecimal serviceFee;
    private BigDecimal totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
    
    // Constructors
    public Transaction() {}
    
    public Transaction(String transactionId, Long buyerId, Long sellerId, 
                      BigDecimal amount, String description, String paymentMethod, 
                      LocalDateTime dueDate, String notes, String serviceChargePaymentOption) {
        this.transactionId = transactionId;
        this.buyerId = buyerId;
        this.sellerId = sellerId;
        this.amount = amount;
        this.description = description;
        this.paymentMethod = paymentMethod;
        this.dueDate = dueDate;
        this.notes = notes;
        this.serviceChargePaymentOption = serviceChargePaymentOption;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public Long getBuyerId() { return buyerId; }
    public void setBuyerId(Long buyerId) { this.buyerId = buyerId; }
    
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public TransactionStatus getStatus() { return status; }
    public void setStatus(TransactionStatus status) { this.status = status; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getDeliveryProof() { return deliveryProof; }
    public void setDeliveryProof(String deliveryProof) { this.deliveryProof = deliveryProof; }
    
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getServiceChargePaymentOption() { return serviceChargePaymentOption; }
    public void setServiceChargePaymentOption(String serviceChargePaymentOption) { this.serviceChargePaymentOption = serviceChargePaymentOption; }
    
    public BigDecimal getServiceFee() { return serviceFee; }
    public void setServiceFee(BigDecimal serviceFee) { this.serviceFee = serviceFee; }
    
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    // Helper methods
    public boolean canBeAcceptedBy(Long userId) {
        return sellerId.equals(userId) && status == TransactionStatus.PENDING;
    }
    
    public boolean canBeFundedBy(Long userId) {
        return buyerId.equals(userId) && status == TransactionStatus.ACCEPTED;
    }
    
    public boolean canBeDeliveredBy(Long userId) {
        return sellerId.equals(userId) && status == TransactionStatus.FUNDED;
    }
    
    public boolean canBeCompletedBy(Long userId) {
        return buyerId.equals(userId) && status == TransactionStatus.DELIVERED;
    }
    
    public boolean canBeCancelledBy(Long userId) {
        return (buyerId.equals(userId) || sellerId.equals(userId)) && 
               (status == TransactionStatus.PENDING || status == TransactionStatus.ACCEPTED);
    }
} 