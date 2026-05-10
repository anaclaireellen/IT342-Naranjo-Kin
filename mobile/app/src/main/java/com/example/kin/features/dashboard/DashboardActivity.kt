package com.example.kin.features.dashboard

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.kin.R
import com.example.kin.features.admin.AdminPanelActivity
import com.example.kin.features.auth.UMainActivity

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        // 1. Initialize ALL UI elements at the start
        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        val tvRole = findViewById<TextView>(R.id.tvRole)
        val btnAdminPanel = findViewById<Button>(R.id.btnAdminPanel)
        val btnLogout = findViewById<Button>(R.id.btnLogout) // Missing this line!

        val sharedPref = getSharedPreferences("KIN_PREFS", Context.MODE_PRIVATE)
        val userName = sharedPref.getString("userName", "User")
        val userRole = sharedPref.getString("userRole", "STUDENT")

        tvWelcome.text = "Welcome, $userName!"
        tvRole.text = "Role: $userRole"

        // 2. Handle Admin Access (Only for Admin buttons)
        if (userRole == "ADMIN") {
            btnAdminPanel.visibility = android.view.View.VISIBLE
            tvRole.setTextColor(android.graphics.Color.RED)

            btnAdminPanel.setOnClickListener {
                val intent = Intent(this, AdminPanelActivity::class.java)
                startActivity(intent)
            }
        }

        // 3. Handle Logout (Outside the IF so Students can also logout!)
        btnLogout.setOnClickListener {
            // Wipe the local session
            sharedPref.edit().clear().apply()

            // Clear activity history and go back to Login
            val intent = Intent(this, UMainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)

            finish()
        }
    }
}
