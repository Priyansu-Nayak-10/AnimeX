window.ENV = {
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://animex-api.onrender.com/api',
  SUPABASE_URL: 'https://qpnvkzhclaylvwbawmhq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwbnZremhjbGF5bHZ3YmF3bWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Nzc3NDMsImV4cCI6MjA4ODI1Mzc0M30.mNVXvWfXWsvIz3anZ5JndIBAQuxBLyQTDy3LJtKDADs'
};
