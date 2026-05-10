package com.example.kin.core.network

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/register")
    suspend fun register(@Body user: User): Response<ResponseBody>

    @POST("api/auth/login")
    suspend fun login(@Body credentials: Map<String, String>): Response<LoginResponse>
}

// Global constant for your local Spring Boot server
const val BASE_URL = "http://10.0.2.2:8080/"
