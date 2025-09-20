package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.dto.UserResponse;
import com.voroshapay.entity.User;
import com.voroshapay.service.UserService;
import com.voroshapay.util.JwtUtil;
import com.voroshapay.excel.ExcelDatabase;
import com.voroshapay.service.OcrService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${app.frontend.url}")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private OcrService ocrService;

    // In-memory phone verification codes: userId -> { code, expiresAt }
    private final Map<Long, VerificationEntry> userIdToVerification = new ConcurrentHashMap<>();

    private static class VerificationEntry {
        final String code;
        final LocalDateTime expiresAt;
        VerificationEntry(String code, LocalDateTime expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    private User getCurrentUser(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }
        String token = auth.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }
        Long userId = jwtUtil.getUserIdFromToken(token);
        return userService.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(HttpServletRequest request) {
        User user = getCurrentUser(request);
        Map<String, Object> data = new HashMap<>();
        data.put("user", new UserResponse(user));
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile loaded", data));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        User user = getCurrentUser(request);
        User updated = userService.updateProfile(user.getId(), body.get("fullName"), body.get("phone"));
        Map<String, Object> data = new HashMap<>();
        data.put("user", new UserResponse(updated));
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile updated", data));
    }

    @PostMapping("/send-verification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendVerification(HttpServletRequest request,
                                                                             @RequestBody(required = false) Map<String, String> body) {
        User user = getCurrentUser(request);
        // Optionally update phone from request payload for verification target only
        String targetPhone = body != null ? body.getOrDefault("phone", user.getPhone()) : user.getPhone();
        if (targetPhone == null || targetPhone.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number is required");
        }
        // Generate 6-digit code
        String code = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);
        userIdToVerification.put(user.getId(), new VerificationEntry(code, expiresAt));

        // Print code on server console for manual entry
        System.out.println("[PHONE-VERIFICATION] User " + user.getId() + " (" + targetPhone + ") code: " + code + " (expires " + expiresAt + ")");

        Map<String, Object> data = new HashMap<>();
        data.put("sent", true);
        return ResponseEntity.ok(new ApiResponse<>(true, "Verification code sent", data));
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPhone(HttpServletRequest request, @RequestBody Map<String, String> body) {
        User user = getCurrentUser(request);
        String code = body.get("verificationCode");
        if (code == null || code.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "verificationCode is required");
        }

        VerificationEntry entry = userIdToVerification.get(user.getId());
        if (entry == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No verification code requested");
        }
        if (LocalDateTime.now().isAfter(entry.expiresAt)) {
            userIdToVerification.remove(user.getId());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code expired");
        }
        if (!code.equals(entry.code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        // Success: mark user phone verified and clear stored code
        userIdToVerification.remove(user.getId());
        User verified = userService.verifyPhone(user.getId());
        Map<String, Object> data = new HashMap<>();
        data.put("user", new UserResponse(verified));
        return ResponseEntity.ok(new ApiResponse<>(true, "Phone verified", data));
    }

    @PostMapping("/verify-nid")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyNid(
            HttpServletRequest request,
            @RequestPart("nidFront") MultipartFile nidFront,
            @RequestPart("nidBack") MultipartFile nidBack) {
        try {
            User user = getCurrentUser(request);
            // Save files under uploads/nid_documents
            java.nio.file.Path uploadDir = Paths.get("uploads", "nid_documents");
            Files.createDirectories(uploadDir);
            String frontName = user.getId() + "-front-" + System.currentTimeMillis() + "-" + nidFront.getOriginalFilename();
            String backName = user.getId() + "-back-" + System.currentTimeMillis() + "-" + nidBack.getOriginalFilename();
            Files.copy(nidFront.getInputStream(), uploadDir.resolve(frontName), StandardCopyOption.REPLACE_EXISTING);
            Files.copy(nidBack.getInputStream(), uploadDir.resolve(backName), StandardCopyOption.REPLACE_EXISTING);

            // OCR
            var ocr = ocrService.processNidImages(nidFront, nidBack, user.getId());
            Map<String, String> info = new HashMap<>();
            info.put("userId", String.valueOf(user.getId()));
            info.put("frontImagePath", frontName);
            info.put("backImagePath", backName);
            Map<?,?> extracted = (Map<?,?>) ocr.get("extractedInfo");
            if (extracted != null) {
                for (Map.Entry<?,?> e : extracted.entrySet()) {
                    info.put(String.valueOf(e.getKey()), String.valueOf(e.getValue()));
                }
            }
            double confVal = 0.0;
            try {
                Number n = (Number) ocr.getOrDefault("confidenceScore", 0);
                confVal = n.doubleValue();
            } catch (Exception ignore) {}
            // Normalize to 0-1 if percentage was returned
            if (confVal > 1.0) confVal = confVal / 100.0;
            info.put("confidenceScore", String.valueOf(confVal));
            String status = (confVal >= 0.4 && info.getOrDefault("nidNumber", "").length() >= 10) ? "verified" : "needs_review";
            info.put("verificationStatus", status);
            info.put("verifiedAt", "verified".equals(status) ? LocalDateTime.now().toString() : "");

            // Upsert in Excel nid_info (one row per user)
            var existing = excel.findOne("nid_info", Map.of("userId", String.valueOf(user.getId())));
            Map<String, String> saved;
            if (existing != null) {
                saved = excel.update("nid_info", Long.parseLong(existing.get("id")), info);
            } else {
                saved = excel.create("nid_info", info);
            }

            // If NID is verified, update user verification status
            if ("verified".equals(status)) {
                userService.verifyNID(user.getId());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("nidInfo", saved);
            return ResponseEntity.ok(new ApiResponse<>(true, "NID uploaded and processed", data));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/nid-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNidInfo(HttpServletRequest request) {
        User user = getCurrentUser(request);
        var row = excel.findOne("nid_info", Map.of("userId", String.valueOf(user.getId())));
        Map<String, Object> data = new HashMap<>();
        data.put("nidInfo", row);
        return ResponseEntity.ok(new ApiResponse<>(true, "NID info", data));
    }

    @GetMapping("/nid-documents/{filename}")
    public ResponseEntity<byte[]> getNidDocument(@PathVariable("filename") String filename) {
        try {
            java.nio.file.Path p = Paths.get("uploads", "nid_documents", filename);
            if (!Files.exists(p)) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            byte[] bytes = Files.readAllBytes(p);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 