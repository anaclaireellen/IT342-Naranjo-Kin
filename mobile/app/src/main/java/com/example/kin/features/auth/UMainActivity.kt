package com.example.kin.features.auth

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.kin.R
import com.example.kin.core.network.RetrofitClient
import com.example.kin.features.dashboard.DashboardActivity
import kotlinx.coroutines.launch

class UMainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val tvRegisterLink = findViewById<TextView>(R.id.tvRegisterLink) // Find it here

        // 1. Setup Register Link (Do this outside the login button)
        tvRegisterLink.setOnClickListener {
            val intent = Intent(this@UMainActivity, RegisterActivity::class.java)
            startActivity(intent)
        }

        // 2. Setup Login Button
        btnLogin.setOnClickListener {
            val email = etEmail.text.toString()
            val password = etPassword.text.toString()
            val credentials = mapOf("email" to email, "identifier" to email, "password" to password)

            lifecycleScope.launch {
                try {
                    val response = RetrofitClient.instance.login(credentials)

                    if (response.isSuccessful && response.body() != null) {
                        val loginData = response.body()!!

                        val sharedPref = getSharedPreferences("KIN_PREFS", Context.MODE_PRIVATE)
                        with(sharedPref.edit()) {
                            putString("userName", loginData.username)
                            putString("userRole", loginData.role)
                            apply()
                        }

                        // Navigate to Dashboard
                        val intent = Intent(this@UMainActivity, DashboardActivity::class.java)
                        startActivity(intent)
                        finish()
                    } else {
                        Toast.makeText(this@UMainActivity, "Login Failed", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Toast.makeText(this@UMainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
