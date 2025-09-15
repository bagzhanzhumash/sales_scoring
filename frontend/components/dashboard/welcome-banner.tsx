"use client"

import { motion } from "framer-motion"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface WelcomeBannerProps {
  userName?: string
  lastLogin?: string
  systemStatus: "healthy" | "warning" | "error"
}

export function WelcomeBanner({ userName = "User", lastLogin, systemStatus }: WelcomeBannerProps) {
  const [greeting, setGreeting] = useState("Good day") // Default greeting to avoid hydration mismatch
  
  useEffect(() => {
    // Only run on client side
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  const getStatusIcon = () => {
    switch (systemStatus) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (systemStatus) {
      case "healthy":
        return "All systems operational"
      case "warning":
        return "Some services degraded"
      case "error":
        return "System issues detected"
    }
  }

  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-8 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-4 right-12 w-12 h-12 bg-white rounded-full animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {greeting}, {userName}!
            </h2>
            <p className="text-blue-100 mb-4 sm:mb-0">
              Welcome back to your Speech Analytics dashboard
              {lastLogin && (
                <span className="block text-sm mt-1">
                  Last login: {new Date(lastLogin).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
