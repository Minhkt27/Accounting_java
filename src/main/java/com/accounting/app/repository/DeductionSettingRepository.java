package com.accounting.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.accounting.app.model.DeductionSetting;

@Repository
public interface DeductionSettingRepository extends JpaRepository<DeductionSetting, Long> {
}
