package com.voroshapay.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@Service
public class OcrService {

    @Value("${ocr.service.url:http://localhost:8500}")
    private String ocrServiceUrl;

    @Value("${ocr.tesseract.data.path:/usr/share/tessdata}")
    private String tessdataPath;

    public Map<String, Object> processNidImages(MultipartFile front, MultipartFile back, long userId) throws IOException {
        // Save to temp files
        Path tmpDir = Files.createTempDirectory("nid_ocr_");
        File frontFile = tmpDir.resolve("front-" + front.getOriginalFilename()).toFile();
        File backFile = tmpDir.resolve("back-" + back.getOriginalFilename()).toFile();
        front.transferTo(frontFile);
        back.transferTo(backFile);

        try {
            Map<String, Object> result = callPythonOcr(frontFile, backFile, userId);
            if (Boolean.TRUE.equals(result.get("success"))) {
                return result;
            }
        } catch (Exception ignore) {}

        // Fallback to Tess4J
        return runTess4j(frontFile, backFile);
    }

    private Map<String, Object> callPythonOcr(File frontFile, File backFile, long userId) {
        RestTemplate rest = new RestTemplate();
        org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        body.add("nid_front", new org.springframework.core.io.FileSystemResource(frontFile));
        body.add("nid_back", new org.springframework.core.io.FileSystemResource(backFile));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<?> req = new HttpEntity<>(body, headers);
        String url = ocrServiceUrl + "/ocr/nid?user_id=" + userId;
        ResponseEntity<?> resp = rest.postForEntity(url, req, Object.class);
        Map<String, Object> out = new HashMap<>();
        if (resp.getBody() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> bodyMap = (Map<String, Object>) resp.getBody();
            out.putAll(bodyMap);
        }
        return out;
    }

    private Map<String, Object> runTess4j(File frontFile, File backFile) {
        Tesseract t = new Tesseract();
        t.setDatapath(tessdataPath);
        t.setLanguage("ben+eng");
        String frontText = "";
        String backText = "";
        try {
            frontText = t.doOCR(frontFile);
            backText = t.doOCR(backFile);
        } catch (TesseractException e) {
            // ignore
        }
        Map<String, String> extracted = extractFields(frontText + "\n" + backText);
        int confidence = estimateConfidence(extracted, frontText, backText);
        Map<String, Object> out = new HashMap<>();
        out.put("success", true);
        out.put("frontText", frontText);
        out.put("backText", backText);
        out.put("extractedInfo", extracted);
        out.put("confidenceScore", confidence);
        out.put("used", "tess4j");
        return out;
    }

    private int estimateConfidence(Map<String, String> extracted, String frontText, String backText) {
        int score = 0;
        if (extracted.get("nidNumber") != null) score += 30;
        if (extracted.get("name") != null) score += 20;
        if (extracted.get("fatherName") != null) score += 10;
        if (extracted.get("motherName") != null) score += 10;
        if (extracted.get("dateOfBirth") != null) score += 10;
        if (extracted.get("address") != null) score += 10;
        int len = (frontText == null ? 0 : frontText.length()) + (backText == null ? 0 : backText.length());
        if (len > 200) score += 5;
        if (len > 500) score += 5;
        return Math.min(100, score);
    }

    private Map<String, String> extractFields(String text) {
        Map<String, String> m = new HashMap<>();
        // Very simple regexes mirroring Node heuristics
        var nid = java.util.regex.Pattern.compile("(\\d{10,17})").matcher(text);
        if (nid.find()) m.put("nidNumber", nid.group(1));
        // naive name: first line with letters
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.matches("[A-Za-z\u0980-\u09FF .]{3,50}")) { m.putIfAbsent("name", trimmed); break; }
        }
        var dob = java.util.regex.Pattern.compile("(\\d{1,2}[./-]\\d{1,2}[./-]\\d{4})").matcher(text);
        if (dob.find()) m.put("dateOfBirth", dob.group(1).replace('.', '/'));
        return m;
    }
} 