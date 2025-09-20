package com.voroshapay.repository;

import com.voroshapay.entity.Transaction;
import com.voroshapay.entity.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Optional<Transaction> findByTransactionId(String transactionId);
    
    List<Transaction> findByBuyerIdOrSellerId(Long buyerId, Long sellerId);
    List<Transaction> findByBuyerId(Long buyerId);
    List<Transaction> findBySellerId(Long sellerId);
    List<Transaction> findByStatus(TransactionStatus status);
    
    @Query("SELECT t FROM Transaction t WHERE t.buyerId = :userId OR t.sellerId = :userId ORDER BY t.createdAt DESC")
    List<Transaction> findByUserId(Long userId);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.buyerId = :userId OR t.sellerId = :userId")
    long countByUserId(Long userId);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE (t.buyerId = :userId OR t.sellerId = :userId) AND t.status = :status")
    long countByUserIdAndStatus(Long userId, TransactionStatus status);
} 