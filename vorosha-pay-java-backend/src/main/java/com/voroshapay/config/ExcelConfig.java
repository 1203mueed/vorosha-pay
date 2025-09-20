package com.voroshapay.config;

import com.voroshapay.excel.ExcelDatabase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExcelConfig {

    @Value("${app.excel.path:./data/database.xlsx}")
    private String excelPath;

    @Bean
    public ExcelDatabase excelDatabase() {
        return new ExcelDatabase(excelPath);
    }
} 