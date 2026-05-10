package com.example.kin.core.network

// This must match your Java User.java fields
data class User(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val role: String = "STUDENT"
)

// This MUST match the keys we fixed in your AuthController.java!
data class LoginResponse(
    val message: String,
    val username: String,
    val role: String
)
