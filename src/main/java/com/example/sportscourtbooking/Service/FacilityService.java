package com.example.sportscourtbooking.Service;

import com.example.sportscourtbooking.Entity.SportsFacility;
import com.example.sportscourtbooking.Repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository repository;

    private void validate(SportsFacility facility) {
        if (!facility.getOpeningTime().isBefore(
                facility.getClosingTime())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Invalid operating hours");
        }
    }

    public SportsFacility add(SportsFacility facility) {
        validate(facility);
        facility.setFacilityId(null);
        if (facility.getStatus() == null)
            facility.setStatus(SportsFacility.FacilityStatus.AVAILABLE);
        return repository.save(facility);
    }

    public List<SportsFacility> getAll() {
        return repository.findAll();
    }

    public SportsFacility getById(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Facility not found"));
    }

    public SportsFacility update(Long id, SportsFacility details) {
        SportsFacility facility = getById(id);
        validate(details);

        facility.setFacilityName(details.getFacilityName());
        facility.setSportType(details.getSportType());
        facility.setLocation(details.getLocation());
        facility.setOpeningTime(details.getOpeningTime());
        facility.setClosingTime(details.getClosingTime());

        if (details.getStatus() != null)
            facility.setStatus(details.getStatus());

        return repository.save(facility);
    }
}
