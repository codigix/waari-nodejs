require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);

// ✅ Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Must be backend only
);

// ✅ Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ✅ Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Default Test Route =====
app.get('/', (req, res) => {
  res.send('Hello from Node.js + Socket.io + Supabase');
});

// ===== Supabase Test Route =====
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ===== Login API (Plain Passwords for Now) =====
app.post('/api/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // ⚠️ WARNING: Plain-text password! Replace with hashed login in production
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("🛑 Supabase error:", error.message);
      return res.status(500).json({ error: 'Server error. Try again later.' });
    }

    if (!user) {
      console.warn("❌ Login failed for:", email, password);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      user
    });

  } catch (err) {
    console.error("🔥 Unexpected server error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ===== Route Imports =====
const salesRoutes = require('./src/routes/sales.routes');
const adminRoutes = require('./src/routes/admin.routes');
const couponsRoutes = require('./src/routes/couponsRoutes');
const enquiryReportRoutes = require('./src/routes/enquiryReportRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const operationRoutes = require('./src/routes/operation.routes');
const accountsRoutes = require('./src/routes/accounts.routes');
const webRoutes = require('./src/routes/webRoutes');
const commonRoutes = require('./src/routes/common.routes');
const testRoutes = require('./src/routes/testRoute');
const tourRoutes = require('./src/routes/tourRoutes');

// ===== Mount Routes =====
app.use('/api/sales', salesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupon', couponsRoutes);
app.use('/api/enquiry-report', enquiryReportRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api', webRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/test', testRoutes);
app.use('/api/tour', tourRoutes);

// ===== Socket.io Connection =====
io.on('connection', (socket) => {
  console.log('🟢 A user connected');

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected');
  });
});

// ===== Serve Frontend in Production =====
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
}

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
