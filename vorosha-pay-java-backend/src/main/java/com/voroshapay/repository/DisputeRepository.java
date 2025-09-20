package com.voroshapay.repository;

import com.voroshapay.entity.Dispute;
import com.voroshapay.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    
    List<Dispute> findByTransactionId(Long transactionId);
    List<Dispute> findByFiledBy(Long filedBy);
    List<Dispute> findByStatus(DisputeStatus status);
    
    @Query("SELECT d FROM Dispute d WHERE d.filedBy = :userId ORDER BY d.createdAt DESC")
    List<Dispute> findByUserIdOrderByCreatedAtDesc(Long userId);
} 