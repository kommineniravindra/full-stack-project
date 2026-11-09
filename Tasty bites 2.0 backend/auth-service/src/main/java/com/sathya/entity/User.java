package com.sathya.entity;

import com.sathya.dto.SignupRequest;

import jakarta.persistence.*;
import lombok.*;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users") 
@Entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true) 
    private String email; 
    private String password;
    private String role;
}