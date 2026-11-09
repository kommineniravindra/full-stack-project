package com.sathya.service;

import com.sathya.entity.User;
import com.sathya.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
     @Autowired
     private final  UserRepository userRepository;
     private final PasswordEncoder passwordEncoder;

    // Change parameter from 'userName' to 'email'
    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) { 
            throw new RuntimeException("User already exists with email: " + user.getEmail());
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Change parameters from 'userName' to 'email'
    public User validateUser(String email, String rawPassword) {
        return userRepository.findByEmail(email) 
                .filter(user -> passwordEncoder.matches(rawPassword, user.getPassword()))
                .orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}