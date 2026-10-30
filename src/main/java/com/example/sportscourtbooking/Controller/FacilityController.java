package com.example.sportscourtbooking.Controller;

import com.example.sportscourtbooking.Entity.SportsFacility;
import com.example.sportscourtbooking.Service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService service;

    @PostMapping
    public SportsFacility add(
            @Valid @RequestBody SportsFacility facility) {
        return service.add(facility);
    }

    @GetMapping
    public List<SportsFacility> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public SportsFacility getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public SportsFacility update(
            @PathVariable Long id,
            @Valid @RequestBody SportsFacility facility) {
        return service.update(id, facility);
    }
}
