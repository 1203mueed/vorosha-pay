package com.voroshapay.controller;

import com.voroshapay.dto.ApiResponse;
import com.voroshapay.entity.Transaction;
import com.voroshapay.excel.ExcelDatabase;
import com.voroshapay.service.TransactionService;
import com.voroshapay.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/disputes")
@CrossOrigin(origins = "${app.frontend.url}")
public class DisputeController {

    private static final String DISPUTE_DIR = "uploads" + File.separator + "disputes";

    @Autowired
    private ExcelDatabase excel;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TransactionService transactionService;

    private Long getUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = auth.substring(7);
        if (!jwtUtil.validateToken(token)) {
            throw new RuntimeException("Invalid token");
        }
        return jwtUtil.getUserIdFromToken(token);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> createDispute(
            HttpServletRequest request,
            @RequestParam("transactionId") Long transactionId,
            @RequestParam("reason") String reason,
            @RequestParam(value = "evidence", required = false) MultipartFile evidence
    ) {
        try {
            Long userId = getUserId(request);

            // Verify user is part of transaction
            Transaction tx = transactionService.findByIdAndUserId(transactionId, userId);
            if (tx == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Transaction not found or access denied", null));
            }

            // Ensure uploads dir exists
            File dir = new File(DISPUTE_DIR);
            if (!dir.exists()) dir.mkdirs();

            String evidenceFile = "";
            if (evidence != null && !evidence.isEmpty()) {
                String original = Objects.requireNonNull(evidence.getOriginalFilename(), "file");
                String ext = "";
                int dot = original.lastIndexOf('.');
                if (dot >= 0) ext = original.substring(dot).toLowerCase();
                String filename = "evidence-" + System.currentTimeMillis() + "-" + Math.abs(original.hashCode()) + ext;
                Path target = Paths.get(DISPUTE_DIR, filename);
                Files.copy(evidence.getInputStream(), target);
                evidenceFile = filename; // store filename; serve via endpoint below
            }

            // Persist dispute in Excel DB
            Map<String, String> record = new HashMap<>();
            record.put("transactionId", String.valueOf(transactionId));
            record.put("filedBy", String.valueOf(userId));
            record.put("reason", reason == null ? "" : reason);
            record.put("evidence", evidenceFile);
            record.put("status", "UNDER_REVIEW");
            record.put("resolution", "");
            record.put("createdAt", LocalDateTime.now().toString());
            record.put("resolvedAt", "");

            excel.ensureSheetWithHeader("disputes", Arrays.asList(
                    "id","transactionId","filedBy","reason","evidence","status","resolution","createdAt","resolvedAt"
            ));
            Map<String, String> saved = excel.create("disputes", record);

            // Mark transaction status as DISPUTED
            try {
                transactionService.disputeTransaction(transactionId, userId, reason);
            } catch (Exception ignore) {}

            return ResponseEntity.ok(new ApiResponse<>(true, "Dispute filed", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/my-disputes")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> myDisputes(HttpServletRequest request) {
        try {
            Long userId = getUserId(request);
            excel.ensureSheetWithHeader("disputes", Arrays.asList(
                    "id","transactionId","filedBy","reason","evidence","status","resolution","createdAt","resolvedAt"
            ));
            List<Map<String, String>> all = excel.findAll("disputes");
            List<Map<String, String>> mine = new ArrayList<>();
            for (Map<String, String> row : all) {
                if (String.valueOf(userId).equals(row.get("filedBy"))) {
                    mine.add(row);
                }
            }
            // sort by createdAt desc
            mine.sort((a,b) -> String.valueOf(b.get("createdAt")).compareTo(String.valueOf(a.get("createdAt"))));
            return ResponseEntity.ok(new ApiResponse<>(true, "OK", mine));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAll(@RequestParam(value = "status", required = false) String status) {
        try {
            excel.ensureSheetWithHeader("disputes", Arrays.asList(
                    "id","transactionId","filedBy","reason","evidence","status","resolution","createdAt","resolvedAt"
            ));
            List<Map<String, String>> all = excel.findAll("disputes");
            if (status != null && !status.trim().isEmpty()) {
                String s = status.trim();
                all.removeIf(row -> !s.equalsIgnoreCase(String.valueOf(row.get("status"))));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "OK", all));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getOne(@PathVariable Long id) {
        try {
            Map<String, String> row = excel.findById("disputes", id);
            if (row == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse<>(false, "Not found", null));
            return ResponseEntity.ok(new ApiResponse<>(true, "OK", row));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/evidence/{filename}")
    public ResponseEntity<Resource> getEvidence(@PathVariable String filename) {
        try {
            File file = Paths.get(DISPUTE_DIR, filename).toFile();
            if (!file.exists() || !file.isFile()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            FileSystemResource resource = new FileSystemResource(file);
            String contentType = Files.probeContentType(file.toPath());
            if (contentType == null) contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + file.getName())
                    .contentLength(file.length())
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 