package com.voroshapay.excel;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.stream.Collectors;

public class ExcelDatabase {
    private final String filePath;
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    
    // Simple cache to reduce file I/O
    private final Map<String, List<Map<String, String>>> cache = new ConcurrentHashMap<>();
    private final Map<String, Long> cacheTimestamps = new ConcurrentHashMap<>();
    private static final long CACHE_EXPIRY_MS = 30000; // 30 seconds cache

    public ExcelDatabase() {
        // Use the existing file name found in the repo
        this("data/database.xlsx");
    }

    public ExcelDatabase(String filePath) {
        this.filePath = filePath;
        init();
        updateSchema(); // Update schema to include new fields
    }

    private void init() {
        try {
            Path p = Paths.get(filePath);
            // Ensure parent directory exists
            if (p.getParent() != null) {
                Files.createDirectories(p.getParent());
            }
            if (!Files.exists(p)) {
                try (Workbook wb = new XSSFWorkbook()) {
                    createSheetWithHeader(wb, "users", Arrays.asList("id","fullName","email","phone","password","isVerified","isPhoneVerified","isNIDVerified","createdAt","updatedAt"));
                    createSheetWithHeader(wb, "user_roles", Arrays.asList("id","userId","role","assignedAt","assignedBy"));
                    createSheetWithHeader(wb, "transactions", Arrays.asList("id","transactionId","buyerId","sellerId","amount","description","status","paymentMethod","deliveryProof","dueDate","notes","serviceChargePaymentOption","serviceFee","totalAmount","createdAt","updatedAt","completedAt"));
                    createSheetWithHeader(wb, "payments", Arrays.asList("id","paymentId","transactionId","userId","amount","serviceFee","totalAmount","paymentMethod","status","gatewayResponse","failureReason","createdAt","updatedAt","completedAt"));
                    createSheetWithHeader(wb, "disputes", Arrays.asList("id","transactionId","filedBy","reason","evidence","status","resolution","createdAt","resolvedAt"));
                    createSheetWithHeader(wb, "phone_verifications", Arrays.asList("id","userId","phone","code","expiresAt","isUsed","createdAt"));
                    createSheetWithHeader(wb, "nid_info", Arrays.asList(
                        "id","userId","frontImagePath","backImagePath",
                        "nidNumber","name","dateOfBirth",
                        "verificationStatus","verifiedAt","confidenceScore",
                        "createdAt","updatedAt"
                    ));
                    // Notifications sheet
                    createSheetWithHeader(wb, "notifications", Arrays.asList(
                        "id","userId","type","title","message","timestamp","isRead","createdAt"
                    ));
                    // Chat messages sheet
                    createSheetWithHeader(wb, "chat_messages", Arrays.asList(
                        "id","transactionId","senderId","receiverId","message","sentAt","isRead"
                    ));
                    try (FileOutputStream fos = new FileOutputStream(p.toFile())) {
                        wb.write(fos);
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void createSheetWithHeader(Workbook wb, String name, List<String> headers) {
        Sheet sheet = wb.createSheet(name);
        Row header = sheet.createRow(0);
        for (int i = 0; i < headers.size(); i++) {
            Cell c = header.createCell(i);
            c.setCellValue(headers.get(i));
        }
    }

    // NEW: Ensure a sheet exists and has the specified header row
    public void ensureSheetWithHeader(String sheetName, List<String> headers) {
        lock.writeLock().lock();
        try (Workbook wb = openWorkbook()) {
            Sheet sheet = wb.getSheet(sheetName);
            if (sheet == null) {
                // Create with header if missing entirely
                createSheetWithHeader(wb, sheetName, headers);
                saveWorkbook(wb);
                return;
            }
            // If header row is missing or empty, rewrite header
            Row headerRow = sheet.getRow(0);
            if (headerRow == null || headerRow.getLastCellNum() <= 0) {
                headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.size(); i++) {
                    Cell c = headerRow.createCell(i);
                    c.setCellValue(headers.get(i));
                }
                saveWorkbook(wb);
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private Workbook openWorkbook() throws Exception {
        File f = new File(filePath);
        if (!f.exists()) return new XSSFWorkbook();
        
        // Try to open with retry mechanism for locked files
        int maxRetries = 3;
        int retryCount = 0;
        
        while (retryCount < maxRetries) {
            try (FileInputStream fis = new FileInputStream(f)) {
                return new XSSFWorkbook(fis);
            } catch (IOException e) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    throw new Exception("Cannot open Excel file after " + maxRetries + " attempts. File may be locked. Please close Excel and try again. Error: " + e.getMessage());
                }
                try {
                    Thread.sleep(500); // Wait 500ms before retry
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new Exception("Interrupted while waiting to retry opening Excel file", ie);
                }
            }
        }
        
        throw new Exception("Unexpected error opening Excel file");
    }

    private void saveWorkbook(Workbook wb) throws Exception {
        // Try to save with retry mechanism for locked files
        int maxRetries = 3;
        int retryCount = 0;
        
        while (retryCount < maxRetries) {
            try (FileOutputStream fos = new FileOutputStream(new File(filePath))) {
                wb.write(fos);
                return; // Success, exit the method
            } catch (IOException e) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    throw new Exception("Cannot save Excel file after " + maxRetries + " attempts. File may be locked. Please close Excel and try again. Error: " + e.getMessage());
                }
                try {
                    Thread.sleep(500); // Wait 500ms before retry
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new Exception("Interrupted while waiting to retry saving Excel file", ie);
                }
            }
        }
    }

    private List<String> getHeaders(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return Collections.emptyList();
        List<String> headers = new ArrayList<>();
        for (Cell cell : headerRow) {
            headers.add(cell.getStringCellValue());
        }
        return headers;
    }

    private String cellToString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toString();
                }
                double num = cell.getNumericCellValue();
                if (num == Math.rint(num)) {
                    yield String.valueOf((long) num);
                }
                yield String.valueOf(num);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> cell.getCellFormula();
            case BLANK, _NONE, ERROR -> "";
        };
    }

    public List<Map<String, String>> findAll(String sheetName) {
        // Check cache first
        Long cacheTime = cacheTimestamps.get(sheetName);
        if (cacheTime != null && (System.currentTimeMillis() - cacheTime) < CACHE_EXPIRY_MS) {
            List<Map<String, String>> cached = cache.get(sheetName);
            if (cached != null) {
                return new ArrayList<>(cached); // Return copy to prevent modification
            }
        }
        
        lock.readLock().lock();
        try (Workbook wb = openWorkbook()) {
            Sheet sheet = wb.getSheet(sheetName);
            if (sheet == null) return Collections.emptyList();
            List<String> headers = getHeaders(sheet);
            List<Map<String, String>> rows = new ArrayList<>();
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                Map<String, String> map = new HashMap<>();
                for (int c = 0; c < headers.size(); c++) {
                    String key = headers.get(c);
                    map.put(key, cellToString(row.getCell(c)));
                }
                rows.add(map);
            }
            
            // Cache the results
            cache.put(sheetName, new ArrayList<>(rows));
            cacheTimestamps.put(sheetName, System.currentTimeMillis());
            
            return rows;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Map<String, String> findById(String sheet, long id) {
        lock.readLock().lock();
        try (Workbook wb = openWorkbook()) {
            Sheet sheetObj = wb.getSheet(sheet);
            if (sheetObj == null) return null;
            
            List<String> headers = getHeaders(sheetObj);
            
            // Optimized: Direct row access instead of scanning all rows
            for (int r = 1; r <= sheetObj.getLastRowNum(); r++) {
                Row row = sheetObj.getRow(r);
                if (row == null) continue;
                
                String rowId = cellToString(row.getCell(0)); // Assuming ID is in first column
                if (String.valueOf(id).equals(rowId)) {
                    Map<String, String> map = new HashMap<>();
                    for (int c = 0; c < headers.size(); c++) {
                        String key = headers.get(c);
                        map.put(key, cellToString(row.getCell(c)));
                    }
                    return map;
                }
            }
            return null;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            lock.readLock().unlock();
        }
    }

    public Map<String, String> findOne(String sheet, Map<String, String> where) {
        return findAll(sheet).stream().filter(r -> matches(r, where)).findFirst().orElse(null);
    }

    public List<Map<String, String>> findMany(String sheet, Map<String, String> where) {
        return findAll(sheet).stream().filter(r -> matches(r, where)).collect(Collectors.toList());
    }

    private boolean matches(Map<String, String> row, Map<String, String> where) {
        for (Map.Entry<String, String> e : where.entrySet()) {
            if (!Objects.equals(row.get(e.getKey()), e.getValue())) return false;
        }
        return true;
    }

    private long nextId(Sheet sheet) {
        long max = 0;
        for (int r = 1; r <= sheet.getLastRowNum(); r++) {
            Row row = sheet.getRow(r);
            if (row == null) continue;
            Cell idCell = row.getCell(0);
            String idStr = cellToString(idCell);
            try { max = Math.max(max, Long.parseLong(idStr)); } catch (Exception ignore) {}
        }
        return max + 1;
    }

    private void writeRow(Row row, List<String> headers, Map<String, String> data) {
        for (int i = 0; i < headers.size(); i++) {
            String key = headers.get(i);
            String val = data.getOrDefault(key, "");
            Cell cell = row.getCell(i);
            if (cell == null) cell = row.createCell(i);
            cell.setCellValue(val);
        }
    }

    public Map<String, String> create(String sheetName, Map<String, String> input) {
        Map<String, String> data = new HashMap<>(input);
        lock.writeLock().lock();
        try (Workbook wb = openWorkbook()) {
            Sheet sheet = wb.getSheet(sheetName);
            if (sheet == null) {
                sheet = wb.createSheet(sheetName);
            }
            List<String> headers = getHeaders(sheet);
            // If sheet has no header, write keys from provided data order (best effort)
            if (headers.isEmpty() && !data.isEmpty()) {
                headers = new ArrayList<>(data.keySet());
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.size(); i++) {
                    Cell c = headerRow.createCell(i);
                    c.setCellValue(headers.get(i));
                }
            }
            long id = nextId(sheet);
            data.put("id", String.valueOf(id));
            LocalDateTime now = LocalDateTime.now();
            if (headers.contains("createdAt")) data.putIfAbsent("createdAt", now.toString());
            if (headers.contains("updatedAt")) data.putIfAbsent("updatedAt", now.toString());
            if (sheet.getRow(0) == null && !headers.isEmpty()) {
                sheet.createRow(0);
            }
            int rowNum = sheet.getLastRowNum() + 1;
            if (rowNum == 0) rowNum = 1; // ensure header row exists at 0
            Row row = sheet.createRow(rowNum);
            writeRow(row, headers, data);
            saveWorkbook(wb);
            
            // Invalidate cache
            cache.remove(sheetName);
            cacheTimestamps.remove(sheetName);
            
            return data;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public Map<String, String> update(String sheetName, long id, Map<String, String> input) {
        Map<String, String> data = new HashMap<>(input);
        lock.writeLock().lock();
        try (Workbook wb = openWorkbook()) {
            Sheet sheet = wb.getSheet(sheetName);
            if (sheet == null) return null;
            List<String> headers = getHeaders(sheet);
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String rowId = cellToString(row.getCell(0));
                if (String.valueOf(id).equals(rowId)) {
                    if (headers.contains("updatedAt")) data.put("updatedAt", LocalDateTime.now().toString());
                    Map<String, String> merged = new HashMap<>();
                    for (int c = 0; c < headers.size(); c++) {
                        String key = headers.get(c);
                        merged.put(key, data.getOrDefault(key, cellToString(row.getCell(c))));
                    }
                    writeRow(row, headers, merged);
                    saveWorkbook(wb);
                    
                    // Invalidate cache
                    cache.remove(sheetName);
                    cacheTimestamps.remove(sheetName);
                    
                    return merged;
                }
            }
            return null;
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            lock.writeLock().unlock();
        }
    }

    public String generateTransactionId() {
        return "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    /**
     * Update existing database schema to include new fields
     */
    public void updateSchema() {
        try {
            Path p = Paths.get(filePath);
            if (!Files.exists(p)) {
                return; // Database doesn't exist yet, will be created with correct schema
            }
            
            try (FileInputStream fis = new FileInputStream(filePath);
                 Workbook wb = WorkbookFactory.create(fis);
                 FileOutputStream fos = new FileOutputStream(filePath)) {
                
                // Update users sheet if it exists
                Sheet usersSheet = wb.getSheet("users");
                if (usersSheet != null) {
                    Row headerRow = usersSheet.getRow(0);
                    if (headerRow != null) {
                        // Check if new columns already exist
                        boolean hasIsPhoneVerified = false;
                        boolean hasIsNIDVerified = false;
                        
                        for (Cell cell : headerRow) {
                            if (cell.getCellType() == CellType.STRING) {
                                String value = cell.getStringCellValue();
                                if ("isPhoneVerified".equals(value)) hasIsPhoneVerified = true;
                                if ("isNIDVerified".equals(value)) hasIsNIDVerified = true;
                            }
                        }
                        
                        // Add missing columns
                        int lastCellNum = headerRow.getLastCellNum();
                        if (!hasIsPhoneVerified) {
                            Cell newCell = headerRow.createCell(lastCellNum++);
                            newCell.setCellValue("isPhoneVerified");
                        }
                        if (!hasIsNIDVerified) {
                            Cell newCell = headerRow.createCell(lastCellNum++);
                            newCell.setCellValue("isNIDVerified");
                        }
                    }
                }
                
                // Update transactions sheet if it exists
                Sheet transactionsSheet = wb.getSheet("transactions");
                if (transactionsSheet != null) {
                    Row headerRow = transactionsSheet.getRow(0);
                    if (headerRow != null) {
                        // Check if new columns already exist
                        boolean hasServiceChargeOption = false;
                        boolean hasServiceFee = false;
                        boolean hasTotalAmount = false;
                        
                        for (Cell cell : headerRow) {
                            if (cell.getCellType() == CellType.STRING) {
                                String value = cell.getStringCellValue();
                                if ("serviceChargePaymentOption".equals(value)) hasServiceChargeOption = true;
                                if ("serviceFee".equals(value)) hasServiceFee = true;
                                if ("totalAmount".equals(value)) hasTotalAmount = true;
                            }
                        }
                        
                        // Add missing columns
                        int lastCellNum = headerRow.getLastCellNum();
                        if (!hasServiceChargeOption) {
                            Cell newCell = headerRow.createCell(lastCellNum++);
                            newCell.setCellValue("serviceChargePaymentOption");
                        }
                        if (!hasServiceFee) {
                            Cell newCell = headerRow.createCell(lastCellNum++);
                            newCell.setCellValue("serviceFee");
                        }
                        if (!hasTotalAmount) {
                            Cell newCell = headerRow.createCell(lastCellNum++);
                            newCell.setCellValue("totalAmount");
                        }
                    }
                }
                
                wb.write(fos);
            }
        } catch (Exception e) {
            System.err.println("Error updating database schema: " + e.getMessage());
        }
    }
} 