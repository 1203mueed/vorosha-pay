package com.voroshapay.repository;

import com.voroshapay.entity.Payment;
import com.voroshapay.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByPaymentId(String paymentId);
    List<Payment> findByUserId(Long userId);
    List<Payment> findByTransactionId(Long transactionId);
    List<Payment> findByStatus(PaymentStatus status);
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);
} 