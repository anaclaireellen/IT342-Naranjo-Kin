package com.example.kin.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.text.Normalizer;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.kin.model.User;
import com.example.kin.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private boolean isPasswordMatch(String rawPassword, User user) {
        String storedPassword = user.getPassword();
        if (rawPassword == null || storedPassword == null) {
            return false;
        }

        boolean looksEncoded = storedPassword.startsWith("$2a$")
            || storedPassword.startsWith("$2b$")
            || storedPassword.startsWith("$2y$");

        if (looksEncoded) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        boolean plainTextMatch = storedPassword.equals(rawPassword);
        if (plainTextMatch) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
        }

        return plainTextMatch;
    }

    private String slugifyNamePart(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "");

        return normalized;
    }

    private String generateUsernameBase(String firstName, String lastName) {
        String first = slugifyNamePart(firstName);
        String last = slugifyNamePart(lastName);

        if (first.isEmpty() || last.isEmpty()) {
            return "";
        }

        return first + "." + last;
    }

    private String buildCitEmail(String username) {
        if (username == null || username.isBlank()) {
            return "";
        }

        return username.trim().toLowerCase() + "@cit.edu";
    }

    private String resolveUniqueUsername(String firstName, String lastName, Long currentUserId) {
        String baseUsername = generateUsernameBase(firstName, lastName);
        if (baseUsername.isEmpty()) {
            return "";
        }

        String candidate = baseUsername;
        int suffix = 2;

        while (true) {
            Optional<User> existingUser = userRepository.findByUsername(candidate);
            if (existingUser.isEmpty() || existingUser.get().getId().equals(currentUserId)) {
                return candidate;
            }

            candidate = baseUsername + suffix;
            suffix++;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getFirstName() == null || user.getFirstName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "First name is required."));
        }

        if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Family name is required."));
        }

        user.setFirstName(user.getFirstName().trim());
        user.setLastName(user.getLastName().trim());
        String generatedUsername = resolveUniqueUsername(user.getFirstName(), user.getLastName(), null);
        if (generatedUsername.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Could not generate username from the provided name."));
        }
        String generatedEmail = buildCitEmail(generatedUsername);
        if (userRepository.findByEmail(generatedEmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with this generated email already exists."));
        }
        user.setUsername(generatedUsername);
        user.setEmail(generatedEmail);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole("STUDENT");
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "Registered successfully.",
            "username", user.getUsername()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String identifier = request.get("email") == null ? "" : request.get("email").trim();
        String password = request.get("password");

        Optional<User> userOpt = identifier.contains("@")
            ? userRepository.findByEmail(identifier.toLowerCase())
            : userRepository.findByUsername(identifier);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (isPasswordMatch(password, user)) {
                return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "username", user.getUsername(),
                    "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                    "lastName", user.getLastName() != null ? user.getLastName() : "",
                    "role", user.getRole(),
                    "email", user.getEmail(),
                    "profilePic", user.getProfilePic() != null ? user.getProfilePic() : ""
                ));
            }
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
    }

    @GetMapping("/profiles")
    public ResponseEntity<?> getProfiles(@RequestParam(required = false) List<String> usernames) {
        if (usernames == null || usernames.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        return ResponseEntity.ok(
            userRepository.findByUsernameIn(usernames).stream().map(user -> Map.of(
                "username", user.getUsername(),
                "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                "lastName", user.getLastName() != null ? user.getLastName() : "",
                "profilePic", user.getProfilePic() != null ? user.getProfilePic() : "",
                "role", user.getRole() != null ? user.getRole() : ""
            )).collect(Collectors.toList())
        );
    }

    @PutMapping("/user/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        String currentEmail = updates.get("email") == null ? "" : updates.get("email").trim().toLowerCase();
        User user = userRepository.findByEmail(currentEmail).orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        String currentPassword = updates.get("currentPassword");
        if (currentPassword == null || !isPasswordMatch(currentPassword, user)) {
            return ResponseEntity.status(401).body(Map.of("message", "Incorrect current password. Identity not verified."));
        }

        if (updates.containsKey("firstName")) {
            String firstName = updates.get("firstName");
            if (firstName == null || firstName.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("message", "First name is required."));
            }
            user.setFirstName(firstName.trim());
        }

        if (updates.containsKey("lastName")) {
            String lastName = updates.get("lastName");
            if (lastName == null || lastName.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("message", "Family name is required."));
            }
            user.setLastName(lastName.trim());
        }

        String generatedUsername = resolveUniqueUsername(user.getFirstName(), user.getLastName(), user.getId());
        if (generatedUsername.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Could not generate username from the provided name."));
        }
        String generatedEmail = buildCitEmail(generatedUsername);
        Optional<User> existingEmailOwner = userRepository.findByEmail(generatedEmail);
        if (existingEmailOwner.isPresent() && !existingEmailOwner.get().getId().equals(user.getId())) {
            return ResponseEntity.status(400).body(Map.of("message", "A generated login email already exists for this account."));
        }
        user.setUsername(generatedUsername);
        user.setEmail(generatedEmail);

        if (updates.containsKey("profilePic")) {
            user.setProfilePic(updates.get("profilePic"));
        }

        String newPassword = updates.get("newPassword");
        if (newPassword != null && !newPassword.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "Profile updated successfully!",
            "username", user.getUsername(),
            "email", user.getEmail()
        ));
    }
}
