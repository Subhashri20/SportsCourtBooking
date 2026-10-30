package com.example.sportscourtbooking.Repository;

import com.example.sportscourtbooking.Entity.SportsBooking;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.*;
import java.util.List;

public interface BookingRepository
        extends JpaRepository<SportsBooking, Long> {

    List<SportsBooking> findByStudentStudentId(Long studentId);

    List<SportsBooking> findByFacilityFacilityIdAndBookingDate(
            Long facilityId, LocalDate date);

    @Query("""
        SELECT COUNT(b) FROM SportsBooking b
        WHERE b.facility.facilityId = :facilityId
        AND b.bookingDate = :date
        AND b.status = :status
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    long countOverlappingBookings(
            @Param("facilityId") Long facilityId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") SportsBooking.BookingStatus status);
}
