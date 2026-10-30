package com.example.sportscourtbooking.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;

    @NotBlank
    private String studentName;

    @Email
    @NotBlank
    @Column(unique = true, nullable = false)
    private String email;

    private String contactInfo;
}
