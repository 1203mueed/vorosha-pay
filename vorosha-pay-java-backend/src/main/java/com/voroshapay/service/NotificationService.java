package com.voroshapay.service;

import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class NotificationService {

    @Autowired
    private ExcelDatabase excel;

    private static final List<String> NOTIFICATION_HEADERS = Arrays.asList(
        "id","userId","type","title","message","timestamp","isRead","createdAt"
    );

    private void ensureNotificationSheet() {
        try {
            excel.ensureSheetWithHeader("notifications", NOTIFICATION_HEADERS);
        } catch (Exception e) {
            // Log but don't fail - sheet might already exist
            System.err.println("Warning: Could not ensure notifications sheet: " + e.getMessage());
        }
    }

    public Map<String, String> createNotification(Long userId, String type, String title, String message) {
        ensureNotificationSheet();
        Map<String, String> data = new HashMap<>();
        data.put("userId", String.valueOf(userId));
        data.put("type", type == null ? "info" : type);
        data.put("title", title == null ? "" : title);
        data.put("message", message == null ? "" : message);
        data.put("timestamp", LocalDateTime.now().toString());
        data.put("isRead", "false");
        data.put("createdAt", LocalDateTime.now().toString());
        return excel.create("notifications", data);
    }

    public List<Map<String, String>> getUserNotifications(Long userId) {
        ensureNotificationSheet();
        List<Map<String, String>> all = excel.findMany("notifications", Map.of("userId", String.valueOf(userId)));
        // sort by timestamp desc
        all.sort((a, b) -> String.valueOf(b.getOrDefault("timestamp", "")).compareTo(String.valueOf(a.getOrDefault("timestamp", ""))));
        return all;
    }

    public Map<String, String> markRead(Long id) {
        ensureNotificationSheet();
        Map<String, String> row = excel.findById("notifications", id);
        if (row == null) throw new RuntimeException("Notification not found");
        row.put("isRead", "true");
        row.put("updatedAt", LocalDateTime.now().toString());
        return excel.update("notifications", id, row);
    }
} 