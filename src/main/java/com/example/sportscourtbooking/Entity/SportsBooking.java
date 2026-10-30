package com.example.sportscourtbooking.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Table(name = "sports_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SportsBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookingId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "facility_id")
    private SportsFacility facility;

    private LocalDate bookingDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private LocalDateTime bookingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.CONFIRMED;

    public enum BookingStatus {
        CONFIRMED, CANCELLED, COMPLETED
    }

    @PrePersist
    public void beforeSave() {
        if (bookingTime == null)
            bookingTime = LocalDateTime.now();

        if (status == null)
            status = BookingStatus.CONFIRMED;
    }
}
