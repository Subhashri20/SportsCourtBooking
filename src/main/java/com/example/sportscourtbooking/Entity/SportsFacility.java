package com.example.sportscourtbooking.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalTime;

@Entity
@Table(name = "sports_facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SportsFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long facilityId;

    @NotBlank
    private String facilityName;

    @NotBlank
    private String sportType;

    private String location;

    @NotNull
    private LocalTime openingTime;

    @NotNull
    private LocalTime closingTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FacilityStatus status = FacilityStatus.AVAILABLE;

    public enum FacilityStatus {
        AVAILABLE, MAINTENANCE
    }
}
