package com.ecommerce.promotion.repository;

import com.ecommerce.promotion.model.Promotion;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    Optional<Promotion> findBySlugAndIsActiveTrue(String slug);

    @Query("SELECT p FROM Promotion p "
            + "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%',:name,'%')) "
            + "AND LOWER(p.couponCode) LIKE LOWER(CONCAT('%',:couponCode,'%'))")
    Page<Promotion> findPromotions(@Param("name") String name,
                                   @Param("couponCode") String couponCode,
                                   Pageable pageable);

    @Query("SELECT p FROM Promotion p "
            + "WHERE LOWER(p.name) LIKE LOWER(CONCAT('%',:name,'%')) "
            + "AND LOWER(p.couponCode) LIKE LOWER(CONCAT('%',:couponCode,'%')) "
            + "AND (p.startDate BETWEEN :startDate AND :endDate) "
            + "AND (p.endDate BETWEEN :startDate AND :endDate)")
    Page<Promotion> findPromotionsWithDates(@Param("name") String name,
                                           @Param("couponCode") String couponCode,
                                           @Param("startDate") Instant startDate,
                                           @Param("endDate") Instant endDate,
                                           Pageable pageable);
}
