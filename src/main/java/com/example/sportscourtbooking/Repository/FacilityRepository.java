package com.example.sportscourtbooking.Repository;

import com.example.sportscourtbooking.Entity.SportsFacility;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface FacilityRepository
        extends JpaRepository<SportsFacility, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM SportsFacility f WHERE f.facilityId = :id")
    Optional<SportsFacility> findByIdForUpdate(@Param("id") Long id);
}
