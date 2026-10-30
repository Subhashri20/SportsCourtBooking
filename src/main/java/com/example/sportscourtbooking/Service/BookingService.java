package com.example.sportscourtbooking.Service;

import com.example.sportscourtbooking.Entity.*;
import com.example.sportscourtbooking.Repository.*;
import com.example.sportscourtbooking.Dto.BookingRequest;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final StudentRepository studentRepository;
    private final FacilityRepository facilityRepository;

    private void validateTime(
            LocalDate date, LocalTime start, LocalTime end) {

        if (date == null || start == null || end == null ||
                !start.isBefore(end)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid booking time");
        }

        if (LocalDateTime.of(date, start)
                .isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Cannot book a past time");
        }
    }

    @Transactional
    public SportsBooking book(BookingRequest request) {

        validateTime(
            request.getBookingDate(),
            request.getStartTime(),
            request.getEndTime()
        );

        Student student = studentRepository
            .findById(request.getStudentId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Student not found"));

        // Lock facility to serialize concurrent booking requests.
        SportsFacility facility = facilityRepository
            .findByIdForUpdate(request.getFacilityId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Facility not found"));

        if (facility.getStatus() !=
                SportsFacility.FacilityStatus.AVAILABLE) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Facility under maintenance");
        }

        if (request.getStartTime().isBefore(facility.getOpeningTime())
                || request.getEndTime().isAfter(
                    facility.getClosingTime())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Outside operating hours");
        }

        long conflicts = bookingRepository.countOverlappingBookings(
            facility.getFacilityId(),
            request.getBookingDate(),
            request.getStartTime(),
            request.getEndTime(),
            SportsBooking.BookingStatus.CONFIRMED
        );

        if (conflicts > 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Slot already booked");
        }

        SportsBooking booking = new SportsBooking();

        booking.setStudent(student);
        booking.setFacility(facility);
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(SportsBooking.BookingStatus.CONFIRMED);

        return bookingRepository.saveAndFlush(booking);
    }

    public List<SportsBooking> getAll() {
        return bookingRepository.findAll();
    }

    public List<SportsBooking> studentHistory(Long studentId) {

        if (!studentRepository.existsById(studentId))
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Student not found");

        return bookingRepository.findByStudentStudentId(studentId);
    }

    public List<SportsBooking> facilitySchedule(
            Long facilityId, LocalDate date) {

        if (!facilityRepository.existsById(facilityId))
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Facility not found");

        return bookingRepository
            .findByFacilityFacilityIdAndBookingDate(facilityId, date);
    }

    @Transactional
    public SportsBooking cancel(Long bookingId) {

        SportsBooking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Booking not found"));

        // Use the same facility lock as booking creation.
        facilityRepository.findByIdForUpdate(
            booking.getFacility().getFacilityId());

        if (booking.getStatus() !=
                SportsBooking.BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Booking cannot be cancelled");
        }

        if (!LocalDateTime.of(
                booking.getBookingDate(),
                booking.getStartTime()).isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Booking already started");
        }

        booking.setStatus(SportsBooking.BookingStatus.CANCELLED);

        return bookingRepository.save(booking);
    }

    @Transactional
    public SportsBooking complete(Long bookingId) {

        SportsBooking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Booking not found"));

        facilityRepository.findByIdForUpdate(
            booking.getFacility().getFacilityId());

        if (booking.getStatus() !=
                SportsBooking.BookingStatus.CONFIRMED ||
            LocalDateTime.of(booking.getBookingDate(),
                booking.getEndTime()).isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Booking cannot be completed yet");
        }

        booking.setStatus(SportsBooking.BookingStatus.COMPLETED);
        return bookingRepository.save(booking);
    }

    public List<Map<String, Object>> availableSlots(
            Long facilityId, LocalDate date) {

        SportsFacility facility = facilityRepository.findById(facilityId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Facility not found"));

        if (date.isBefore(LocalDate.now()))
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Past date not allowed");

        List<Map<String, Object>> result = new ArrayList<>();

        LocalTime start = facility.getOpeningTime();

        while (!start.plusHours(1).isAfter(
                facility.getClosingTime())) {

            LocalTime end = start.plusHours(1);

            long conflicts = bookingRepository.countOverlappingBookings(
                facilityId, date, start, end,
                SportsBooking.BookingStatus.CONFIRMED);

            boolean available =
                facility.getStatus() ==
                    SportsFacility.FacilityStatus.AVAILABLE
                && conflicts == 0
                && LocalDateTime.of(date, start)
                    .isAfter(LocalDateTime.now());

            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("startTime", start);
            slot.put("endTime", end);
            slot.put("available", available);

            result.add(slot);
            start = end;
        }

        return result;
    }
}
