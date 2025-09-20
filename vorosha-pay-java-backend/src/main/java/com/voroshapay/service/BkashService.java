package com.voroshapay.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class BkashService {

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private NotificationService notificationService;

    @Value("${bkash.app.key:bka_MDS_sandbox_app_key}")
    private String appKey;

    @Value("${bkash.app.secret:bka_MDS_sandbox_app_secret}")
    private String appSecret;

    @Value("${bkash.username:sandboxTokenizedUser02}")
    private String username;

    @Value("${bkash.password:sandboxTokenizedUser02@12345}")
    private String password;

    @Value("${bkash.base.url:https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> BKASH_TRANSACTION_HEADERS = Arrays.asList(
        "id", "transactionId", "paymentId", "trxId", "phase", "status", 
        "amount", "customerMsisdn", "merchantInvoiceNumber", "intent",
        "authToken", "createdAt", "updatedAt", "expiresAt", "errorMessage"
    );

    private void ensureBkashTransactionSheet() {
        try {
            excel.ensureSheetWithHeader("bkash_transactions", BKASH_TRANSACTION_HEADERS);
        } catch (Exception e) {
            System.err.println("Warning: Could not ensure bkash_transactions sheet: " + e.getMessage());
        }
    }

    /**
     * Phase 1: Grant Token - Get access token for API calls
     */
    public Map<String, Object> grantToken() {
        try {
            String url = baseUrl + "/checkout/token/grant";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("username", username);
            headers.set("password", password);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("app_key", appKey);
            requestBody.put("app_secret", appSecret);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("statusCode", responseJson.get("statusCode").asText());
            result.put("statusMessage", responseJson.get("statusMessage").asText());
            result.put("id_token", responseJson.get("id_token").asText());
            result.put("token_type", responseJson.get("token_type").asText());
            result.put("expires_in", responseJson.get("expires_in").asInt());
            result.put("refresh_token", responseJson.get("refresh_token").asText());

            return result;
        } catch (HttpClientErrorException e) {
            return createErrorResponse("Grant Token failed", e.getResponseBodyAsString());
        } catch (Exception e) {
            return createErrorResponse("Grant Token error", e.getMessage());
        }
    }

    /**
     * Phase 2: Create Payment (Authorization) - Authorize payment without capturing funds
     */
    public Map<String, Object> createPayment(String idToken, String amount, String customerMsisdn, 
                                           String merchantInvoiceNumber, String transactionId) {
        ensureBkashTransactionSheet();
        
        try {
            String url = baseUrl + "/checkout/create";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("authorization", idToken);
            headers.set("x-app-key", appKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("mode", "0011"); // Tokenized
            requestBody.put("payerReference", customerMsisdn);
            requestBody.put("callbackURL", "https://yoursite.com/callback");
            requestBody.put("amount", amount);
            requestBody.put("currency", "BDT");
            requestBody.put("intent", "authorization"); // Key for Auth & Capture
            requestBody.put("merchantInvoiceNumber", merchantInvoiceNumber);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Store authorization details in database
            Map<String, String> dbRecord = new HashMap<>();
            dbRecord.put("transactionId", transactionId);
            dbRecord.put("paymentId", responseJson.has("paymentID") ? responseJson.get("paymentID").asText() : "");
            dbRecord.put("trxId", responseJson.has("trxID") ? responseJson.get("trxID").asText() : "");
            dbRecord.put("phase", "authorization");
            dbRecord.put("status", responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "");
            dbRecord.put("amount", amount);
            dbRecord.put("customerMsisdn", customerMsisdn);
            dbRecord.put("merchantInvoiceNumber", merchantInvoiceNumber);
            dbRecord.put("intent", "authorization");
            dbRecord.put("authToken", idToken);
            dbRecord.put("createdAt", LocalDateTime.now().toString());
            dbRecord.put("expiresAt", LocalDateTime.now().plusHours(24).toString()); // 24 hour expiry

            excel.create("bkash_transactions", dbRecord);

            // Create authorization notification if successful
            String statusCode = responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "";
            if ("0000".equals(statusCode)) {
                try {
                    // Get transaction details for notification
                    Map<String, String> transaction = excel.findById("transactions", Long.parseLong(transactionId));
                    if (transaction != null) {
                        Long buyerId = Long.parseLong(transaction.get("buyerId"));
                        Double totalAmount = Double.parseDouble(amount);
                        
                        // Notify buyer about frozen amount
                        notificationService.createNotification(buyerId, "info", 
                            "Payment Authorized", 
                            String.format("৳%.2f has been frozen for transaction %s. The money will be auto-captured after buyer confirms transaction completion.", 
                                totalAmount, transaction.get("transactionId")));
                    }
                } catch (Exception e) {
                    System.err.println("Error creating authorization notification: " + e.getMessage());
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentID", responseJson.has("paymentID") ? responseJson.get("paymentID").asText() : "");
            result.put("paymentCreateTime", responseJson.has("paymentCreateTime") ? responseJson.get("paymentCreateTime").asText() : "");
            result.put("transactionStatus", responseJson.has("transactionStatus") ? responseJson.get("transactionStatus").asText() : "");
            result.put("statusCode", responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "");
            result.put("statusMessage", responseJson.has("statusMessage") ? responseJson.get("statusMessage").asText() : "");
            result.put("bkashURL", responseJson.has("bkashURL") ? responseJson.get("bkashURL").asText() : "");

            return result;
        } catch (HttpClientErrorException e) {
            return createErrorResponse("Create Payment failed", e.getResponseBodyAsString());
        } catch (Exception e) {
            return createErrorResponse("Create Payment error", e.getMessage());
        }
    }

    /**
     * Phase 3: Execute Payment (Capture) - Capture previously authorized funds
     */
    public Map<String, Object> executePayment(String idToken, String paymentId) {
        ensureBkashTransactionSheet();
        
        try {
            String url = baseUrl + "/checkout/execute";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("authorization", idToken);
            headers.set("x-app-key", appKey);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("paymentID", paymentId);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            // Update database record to capture phase
            List<Map<String, String>> existingRecords = excel.findMany("bkash_transactions", 
                Map.of("paymentId", paymentId));
            
            if (!existingRecords.isEmpty()) {
                Map<String, String> record = existingRecords.get(0);
                record.put("phase", "capture");
                record.put("status", responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "");
                record.put("trxId", responseJson.has("trxID") ? responseJson.get("trxID").asText() : "");
                record.put("updatedAt", LocalDateTime.now().toString());
                
                Long recordId = Long.parseLong(record.get("id"));
                excel.update("bkash_transactions", recordId, record);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentID", responseJson.has("paymentID") ? responseJson.get("paymentID").asText() : "");
            result.put("trxID", responseJson.has("trxID") ? responseJson.get("trxID").asText() : "");
            result.put("transactionStatus", responseJson.has("transactionStatus") ? responseJson.get("transactionStatus").asText() : "");
            result.put("amount", responseJson.has("amount") ? responseJson.get("amount").asText() : "");
            result.put("currency", responseJson.has("currency") ? responseJson.get("currency").asText() : "");
            result.put("statusCode", responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "");
            result.put("statusMessage", responseJson.has("statusMessage") ? responseJson.get("statusMessage").asText() : "");
            result.put("paymentExecuteTime", responseJson.has("paymentExecuteTime") ? responseJson.get("paymentExecuteTime").asText() : "");

            return result;
        } catch (HttpClientErrorException e) {
            return createErrorResponse("Execute Payment failed", e.getResponseBodyAsString());
        } catch (Exception e) {
            return createErrorResponse("Execute Payment error", e.getMessage());
        }
    }

    /**
     * Query Payment Status
     */
    public Map<String, Object> queryPayment(String idToken, String paymentId) {
        try {
            String url = baseUrl + "/checkout/payment/status";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("authorization", idToken);
            headers.set("x-app-key", appKey);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("paymentID", paymentId);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode responseJson = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("paymentID", responseJson.has("paymentID") ? responseJson.get("paymentID").asText() : "");
            result.put("trxID", responseJson.has("trxID") ? responseJson.get("trxID").asText() : "");
            result.put("transactionStatus", responseJson.has("transactionStatus") ? responseJson.get("transactionStatus").asText() : "");
            result.put("amount", responseJson.has("amount") ? responseJson.get("amount").asText() : "");
            result.put("statusCode", responseJson.has("statusCode") ? responseJson.get("statusCode").asText() : "");
            result.put("statusMessage", responseJson.has("statusMessage") ? responseJson.get("statusMessage").asText() : "");

            return result;
        } catch (HttpClientErrorException e) {
            return createErrorResponse("Query Payment failed", e.getResponseBodyAsString());
        } catch (Exception e) {
            return createErrorResponse("Query Payment error", e.getMessage());
        }
    }

    /**
     * Get Authorized Transactions (pending capture)
     */
    public List<Map<String, String>> getAuthorizedTransactions() {
        ensureBkashTransactionSheet();
        List<Map<String, String>> allTransactions = excel.findAll("bkash_transactions");
        return allTransactions.stream()
            .filter(tx -> "authorization".equals(tx.get("phase")) && "0000".equals(tx.get("status")))
            .sorted((a, b) -> b.getOrDefault("createdAt", "").compareTo(a.getOrDefault("createdAt", "")))
            .toList();
    }

    /**
     * Get Captured Transactions (completed)
     */
    public List<Map<String, String>> getCapturedTransactions() {
        ensureBkashTransactionSheet();
        List<Map<String, String>> allTransactions = excel.findAll("bkash_transactions");
        return allTransactions.stream()
            .filter(tx -> "capture".equals(tx.get("phase")))
            .sorted((a, b) -> b.getOrDefault("updatedAt", "").compareTo(a.getOrDefault("updatedAt", "")))
            .toList();
    }

    /**
     * Auto-capture payment when buyer confirms transaction completion
     */
    public Map<String, Object> autoCaptureOnCompletion(Long transactionId) {
        ensureBkashTransactionSheet();
        
        try {
            // Find authorized transaction
            List<Map<String, String>> authorizedTxs = excel.findMany("bkash_transactions", 
                Map.of("transactionId", transactionId.toString(), "phase", "authorization"));
            
            if (authorizedTxs.isEmpty()) {
                return createErrorResponse("No authorized payment found for this transaction", "");
            }
            
            Map<String, String> authTx = authorizedTxs.get(0);
            String paymentId = authTx.get("paymentId");
            String authToken = authTx.get("authToken");
            
            if (paymentId == null || authToken == null) {
                return createErrorResponse("Invalid payment data", "Missing paymentId or authToken");
            }
            
            // Execute the payment capture
            Map<String, Object> captureResult = executePayment(authToken, paymentId);
            
            if ((Boolean) captureResult.get("success")) {
                // Create notifications
                try {
                    // Get transaction details for notifications
                    Map<String, String> transaction = excel.findById("transactions", transactionId);
                    if (transaction != null) {
                        Long buyerId = Long.parseLong(transaction.get("buyerId"));
                        Long sellerId = Long.parseLong(transaction.get("sellerId"));
                        Double amount = Double.parseDouble(authTx.get("amount"));
                        String serviceChargePaymentOption = transaction.get("serviceChargePaymentOption");
                        Double serviceFee = amount * 0.02; // 2% service fee
                        Double sellerAmount;
                        
                        // Calculate seller amount based on service charge payment option
                        switch (serviceChargePaymentOption) {
                            case "BUYER_PAYS":
                                // Buyer pays full service fee, seller gets full amount
                                sellerAmount = amount;
                                break;
                            case "SPLIT":
                                // Service fee is split, seller pays half
                                sellerAmount = amount - (serviceFee / 2);
                                break;
                            case "SELLER_PAYS":
                                // Seller pays full service fee
                                sellerAmount = amount - serviceFee;
                                break;
                            default:
                                // Default to buyer pays
                                sellerAmount = amount;
                                break;
                        }
                        
                        // Get user names
                        Map<String, String> buyer = excel.findById("users", buyerId);
                        Map<String, String> seller = excel.findById("users", sellerId);
                        String buyerName = buyer != null ? buyer.get("fullName") : "Buyer";
                        String sellerName = seller != null ? seller.get("fullName") : "Seller";
                        
                        // Notify buyer
                        notificationService.createNotification(buyerId, "success", 
                            "Payment Captured", 
                            String.format("৳%.2f has been transferred to %s for transaction %s", 
                                sellerAmount, sellerName, transaction.get("transactionId")));
                        
                        // Notify seller
                        notificationService.createNotification(sellerId, "success", 
                            "Payment Received", 
                            String.format("৳%.2f has been transferred from %s for transaction %s", 
                                sellerAmount, buyerName, transaction.get("transactionId")));
                    }
                } catch (Exception e) {
                    System.err.println("Error creating capture notifications: " + e.getMessage());
                }
                
                return captureResult;
            } else {
                return captureResult;
            }
            
        } catch (Exception e) {
            return createErrorResponse("Auto-capture failed", e.getMessage());
        }
    }

    private Map<String, Object> createErrorResponse(String message, String details) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", message);
        error.put("details", details);
        return error;
    }
} 