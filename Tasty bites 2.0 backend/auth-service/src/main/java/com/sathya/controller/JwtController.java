package com.sathya.controller;

import com.sathya.dto.AuthResponse;
import com.sathya.dto.LoginDetails;
import com.sathya.dto.SignupRequest;
import com.sathya.entity.User;
import com.sathya.service.UserService;
import com.sathya.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor // Handles dependency injection for final fields
public class JwtController {

    private final UserService userService;
    

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest signupRequest) {
        try {
            User newUser = new User();
            newUser.setEmail(signupRequest.getEmail());
            newUser.setPassword(signupRequest.getPassword());
            newUser.setRole(signupRequest.getRole());

            User savedUser = userService.registerUser(newUser);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Signup successful for user: " + savedUser.getEmail());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDetails loginDetails) {
        User user = userService.validateUser(loginDetails.getEmail(), loginDetails.getPassword());

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid email or password");
        }

        String token = JwtUtil.generateToken(user.getEmail(), user.getRole(), user.getId());
        
        AuthResponse authResponse = new AuthResponse(token, user.getRole(), user.getEmail());
        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/validate")
    public ResponseEntity<String> validateToken(@RequestHeader("Authorization") String tokenHeader) {
        try {
            // Let JwtUtil handle the "Bearer " prefix extraction
            String role = JwtUtil.extractRole(tokenHeader);
            return ResponseEntity.ok(role);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body("Invalid Token: " + e.getMessage());
        }
    }

    @GetMapping("/users/all")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}