package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.UserService;
import com.voroshapay.service.ChatService;
import com.voroshapay.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "${app.frontend.url}")
public class ChatController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Autowired
    private ChatService chatService;

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

    @GetMapping("/transactions/{transactionId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTransactionMessages(
            HttpServletRequest request,
            @PathVariable String transactionId) {
        try {
            User user = getCurrentUser(request);
            List<Map<String, Object>> messages = chatService.getTransactionMessages(transactionId, user.getId());
            boolean canChat = chatService.canUserChat(transactionId, user.getId());
            
            Map<String, Object> data = new HashMap<>();
            data.put("messages", messages);
            data.put("canChat", canChat);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Messages retrieved", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/transactions/{transactionId}/messages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendMessage(
            HttpServletRequest request,
            @PathVariable String transactionId,
            @RequestBody Map<String, String> body) {
        try {
            User user = getCurrentUser(request);
            String message = body.get("message");
            
            if (message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Message cannot be empty", null));
            }
            
            Map<String, Object> result = chatService.sendMessage(transactionId, user.getId(), message.trim());
            return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/transactions/{transactionId}/messages/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> markMessagesAsRead(
            HttpServletRequest request,
            @PathVariable String transactionId) {
        try {
            User user = getCurrentUser(request);
            Map<String, Object> result = chatService.markMessagesAsRead(transactionId, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Messages marked as read", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUnreadCount(HttpServletRequest request) {
        try {
            User user = getCurrentUser(request);
            int unreadCount = chatService.getUnreadCount(user.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("unreadCount", unreadCount);
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Unread count retrieved", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}