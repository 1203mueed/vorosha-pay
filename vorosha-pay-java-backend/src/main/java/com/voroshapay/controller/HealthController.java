package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "${app.frontend.url}")
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<ApiResponse<Map<String, Object>>> welcome() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Welcome to Vorosha Pay API");
        data.put("documentation", "/api/health for health check");
        data.put("version", "1.0.0");
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Welcome to Vorosha Pay API", data));
    }

    @GetMapping("/api/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Vorosha Pay API is running");
        data.put("timestamp", LocalDateTime.now().toString());
        data.put("version", "1.0.0");
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Vorosha Pay API is running", data));
    }
} 