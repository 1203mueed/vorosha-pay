package com.voroshapay.service;

import com.voroshapay.entity.Transaction;
import com.voroshapay.entity.TransactionStatus;
import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private TransactionService transactionService;

    private static final List<String> CHAT_HEADERS = Arrays.asList(
        "id","transactionId","senderId","receiverId","message","sentAt","isRead"
    );

    private void ensureChatSheet() {
        excel.ensureSheetWithHeader("chat_messages", CHAT_HEADERS);
    }

    private Long safeParseLong(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public List<Map<String, Object>> getTransactionMessages(String transactionId, Long userId) {
        ensureChatSheet();
        Transaction transaction;
        
        // Handle both numeric ID and transactionId string
        try {
            Long numericId = Long.parseLong(transactionId);
            transaction = transactionService.findByIdAndUserId(numericId, userId);
        } catch (NumberFormatException e) {
            transaction = transactionService.findByIdAndUserId(transactionId, userId);
        }
        
        if (transaction == null) {
            throw new RuntimeException("Transaction not found or access denied");
        }
        
        List<Map<String, String>> allMessages = excel.findAll("chat_messages");
        if (allMessages == null || allMessages.isEmpty()) {
            return new ArrayList<>();
        }
        
        final String actualTransactionId = transaction.getTransactionId();
        
        return allMessages.stream()
            .filter(msg -> {
                String msgTransactionId = msg.get("transactionId");
                Long senderId = safeParseLong(msg.get("senderId"));
                Long receiverId = safeParseLong(msg.get("receiverId"));
                
                // Match by actual transaction ID from the transaction object
                boolean transactionMatches = msgTransactionId != null && msgTransactionId.equals(actualTransactionId);
                boolean userParticipates = (senderId != null && senderId.equals(userId)) || 
                                         (receiverId != null && receiverId.equals(userId));
                
                return transactionMatches && userParticipates;
            })
            .sorted((a, b) -> {
                String sentAtA = a.get("sentAt");
                String sentAtB = b.get("sentAt");
                if (sentAtA == null) sentAtA = "";
                if (sentAtB == null) sentAtB = "";
                return sentAtA.compareTo(sentAtB);
            })
            .map(msg -> (Map<String, Object>) new HashMap<String, Object>(msg))
            .collect(Collectors.toList());
    }

    public Map<String, Object> sendMessage(String transactionId, Long senderId, String messageText) {
        ensureChatSheet();
        Transaction transaction;
        
        // Handle both numeric ID and transactionId string
        try {
            Long numericId = Long.parseLong(transactionId);
            transaction = transactionService.findByIdAndUserId(numericId, senderId);
        } catch (NumberFormatException e) {
            transaction = transactionService.findByIdAndUserId(transactionId, senderId);
        }
        
        if (transaction == null) {
            throw new RuntimeException("Transaction not found or access denied");
        }
        if (transaction.getStatus() == TransactionStatus.COMPLETED || 
            transaction.getStatus() == TransactionStatus.CANCELLED) {
            throw new RuntimeException("Cannot send messages for completed or cancelled transactions");
        }

        Long receiverId;
        if (transaction.getBuyerId().equals(senderId)) {
            receiverId = transaction.getSellerId();
        } else if (transaction.getSellerId().equals(senderId)) {
            receiverId = transaction.getBuyerId();
        } else {
            throw new RuntimeException("User is not part of this transaction");
        }

        Map<String, String> messageData = new HashMap<>();
        messageData.put("transactionId", transaction.getTransactionId()); // Use actual transaction ID
        messageData.put("senderId", senderId.toString());
        messageData.put("receiverId", receiverId.toString());
        messageData.put("message", messageText);
        messageData.put("sentAt", LocalDateTime.now().toString());
        messageData.put("isRead", "false");

        Map<String, String> created = excel.create("chat_messages", messageData);
        return new HashMap<>(created);
    }

    public Map<String, Object> markMessagesAsRead(String transactionId, Long userId) {
        ensureChatSheet();
        
        // First get the transaction to find the actual transaction ID
        Transaction transaction;
        try {
            Long numericId = Long.parseLong(transactionId);
            transaction = transactionService.findByIdAndUserId(numericId, userId);
        } catch (NumberFormatException e) {
            transaction = transactionService.findByIdAndUserId(transactionId, userId);
        }
        
        if (transaction == null) {
            Map<String, Object> result = new HashMap<>();
            result.put("updated", 0);
            return result;
        }
        
        List<Map<String, String>> messages = excel.findAll("chat_messages");
        if (messages == null || messages.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("updated", 0);
            return result;
        }
        
        int updated = 0;
        String actualTransactionId = transaction.getTransactionId();
        for (Map<String, String> msg : messages) {
            String msgTransactionId = msg.get("transactionId");
            Long receiverId = safeParseLong(msg.get("receiverId"));
            
            if (msgTransactionId != null && msgTransactionId.equals(actualTransactionId) && 
                receiverId != null && receiverId.equals(userId)) {
                Long msgId = safeParseLong(msg.get("id"));
                if (msgId != null) {
                    Map<String, String> updateData = new HashMap<>();
                    updateData.put("isRead", "true");
                    excel.update("chat_messages", msgId, updateData);
                    updated++;
                }
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("updated", updated);
        return result;
    }

    public int getUnreadCount(Long userId) {
        ensureChatSheet();
        List<Map<String, String>> messages = excel.findAll("chat_messages");
        if (messages == null || messages.isEmpty()) {
            return 0;
        }
        
        return (int) messages.stream()
            .mapToLong(msg -> {
                Long receiverId = safeParseLong(msg.get("receiverId"));
                String isReadStr = msg.get("isRead");
                Boolean isRead = isReadStr != null ? Boolean.parseBoolean(isReadStr) : false;
                return receiverId != null && receiverId.equals(userId) && !isRead ? 1 : 0;
            })
            .sum();
    }

    public Long getUnreadMessageCountForTransaction(Long transactionId, Long userId) {
        ensureChatSheet();
        List<Map<String, String>> messages = excel.findAll("chat_messages");
        if (messages == null || messages.isEmpty()) {
            return 0L;
        }
        
        return messages.stream()
            .mapToLong(msg -> {
                Long msgTransactionId = safeParseLong(msg.get("transactionId"));
                Long receiverId = safeParseLong(msg.get("receiverId"));
                String isReadStr = msg.get("isRead");
                Boolean isRead = isReadStr != null ? Boolean.parseBoolean(isReadStr) : false;
                return msgTransactionId != null && msgTransactionId.equals(transactionId) && 
                       receiverId != null && receiverId.equals(userId) && !isRead ? 1 : 0;
            })
            .sum();
    }

    public boolean canUserChat(String transactionId, Long userId) {
        try {
            Transaction transaction;
            
            // Handle both numeric ID and transactionId string
            try {
                Long numericId = Long.parseLong(transactionId);
                transaction = transactionService.findByIdAndUserId(numericId, userId);
            } catch (NumberFormatException e) {
                transaction = transactionService.findByIdAndUserId(transactionId, userId);
            }
            
            if (transaction == null) {
                return false;
            }
            return transaction.getStatus() != TransactionStatus.COMPLETED && 
                   transaction.getStatus() != TransactionStatus.CANCELLED;
        } catch (Exception e) {
            return false;
        }
    }
} 