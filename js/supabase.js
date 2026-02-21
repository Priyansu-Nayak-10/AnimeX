"use strict";

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = "https://uefrsaagvzwmpcshsfos.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZnJzYWFndnp3bXBjc2hzZm9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzI2NjYsImV4cCI6MjA4NzE0ODY2Nn0.C1Sdr5zTqBRDi45XZ5xNGYVDgTOrFkmhLlpNw0B6aTc";

// Initialize the Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Common Supabase authentication helpers
 */
const SupabaseAuth = {
    /**
     * Get the current session
     */
    async getSession() {
        const {
            data: { session },
            error
        } = await supabaseClient.auth.getSession();
        if (error) {
            console.error("Error getting session:", error.message);
        }
        return session;
    },

    /**
     * Sign out the current user
     */
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Logout failed:", error.message);
            return false;
        }
        localStorage.removeItem("animex_authenticated");
        return true;
    },

    /**
     * Ensure a valid session exists before continuing
     */
    async protectPage() {
        const session = await this.getSession();
        if (!session) {
            window.location.href = "login.html";
        }
        return session;
    }
};
