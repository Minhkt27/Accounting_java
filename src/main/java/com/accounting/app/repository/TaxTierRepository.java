package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.TaxTier;
import java.util.List;

@Repository
public interface TaxTierRepository extends JpaRepository<TaxTier, Long> {
    List<TaxTier> findAllByOrderByTierLevelAsc();
}
