package com.example.kin.features.auth;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void registerGeneratesUniqueUsernameAndCitEmail() throws Exception {
        User existing = new User();
        existing.setId(1L);
        existing.setUsername("ana.naranjo");

        when(userRepository.findByUsername("ana.naranjo")).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("ana.naranjo2")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ana.naranjo2@cit.edu")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-password");

        mockMvc.perform(post("/api/auth/register")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(Map.of(
                    "firstName", "Ana",
                    "lastName", "Naranjo",
                    "password", "secret123",
                    "role", "STUDENT"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username", is("ana.naranjo2")))
            .andExpect(jsonPath("$.email", is("ana.naranjo2@cit.edu")));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        org.assertj.core.api.Assertions.assertThat(saved.getUsername()).isEqualTo("ana.naranjo2");
        org.assertj.core.api.Assertions.assertThat(saved.getEmail()).isEqualTo("ana.naranjo2@cit.edu");
        org.assertj.core.api.Assertions.assertThat(saved.getPassword()).isEqualTo("encoded-password");
    }

    @Test
    void loginAcceptsGeneratedEmailIdentifier() throws Exception {
        User user = new User();
        user.setUsername("ana.naranjo");
        user.setFirstName("Ana");
        user.setLastName("Naranjo");
        user.setEmail("ana.naranjo@cit.edu");
        user.setPassword("$2a$encoded");
        user.setRole("STUDENT");

        when(userRepository.findByEmail("ana.naranjo@cit.edu")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(eq("secret123"), any())).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(Map.of(
                    "identifier", "ana.naranjo@cit.edu",
                    "password", "secret123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username", is("ana.naranjo")))
            .andExpect(jsonPath("$.email", is("ana.naranjo@cit.edu")));
    }

    @Test
    void profilesReturnsRequestedProfileSummaries() throws Exception {
        User user = new User();
        user.setUsername("ana.naranjo");
        user.setFirstName("Ana");
        user.setLastName("Naranjo");
        user.setRole("STUDENT");
        user.setProfilePic("");

        when(userRepository.findByUsernameIn(List.of("ana.naranjo"))).thenReturn(List.of(user));

        mockMvc.perform(get("/api/auth/profiles").param("usernames", "ana.naranjo"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].username", is("ana.naranjo")))
            .andExpect(jsonPath("$[0].firstName", is("Ana")));
    }
}
