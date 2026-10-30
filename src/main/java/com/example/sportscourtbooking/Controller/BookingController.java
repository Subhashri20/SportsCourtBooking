package com.example.sportscourtbooking.Controller;

import com.example.sportscourtbooking.Dto.BookingRequest;
import com.example.sportscourtbooking.Entity.SportsBooking;
import com.example.sportscourtbooking.Service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService service;

    @PostMapping
    public SportsBooking book(
            @Valid @RequestBody BookingRequest request) {
        return service.book(request);
    }

    @GetMapping
    public List<SportsBooking> getAll() {
        return service.getAll();
    }

    @GetMapping("/student/{studentId}")
    public List<SportsBooking> history(
            @PathVariable Long studentId) {
        return service.studentHistory(studentId);
    }

    @GetMapping("/schedule/{facilityId}")
    public List<SportsBooking> schedule(
            @PathVariable Long facilityId,
            @RequestParam LocalDate date) {
        return service.facilitySchedule(facilityId, date);
    }

    @GetMapping("/available/{facilityId}")
    public List<Map<String, Object>> available(
            @PathVariable Long facilityId,
            @RequestParam LocalDate date) {
        return service.availableSlots(facilityId, date);
    }

    @PutMapping("/{id}/cancel")
    public SportsBooking cancel(@PathVariable Long id) {
        return service.cancel(id);
    }

    @PutMapping("/{id}/complete")
    public SportsBooking complete(@PathVariable Long id) {
        return service.complete(id);
    }
}
