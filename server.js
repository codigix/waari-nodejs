require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

// ===== Supabase Connection =====
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Keep private in backend only!
);

// ===== Express + Socket.io Setup =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ✅ Enable CORS for React frontend
app.use(cors({
  origin: 'http://localhost:5173', // React dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Default Route =====
app.get('/', (req, res) => {
  res.send('Hello from Node.js + Socket.io + Supabase');
});

// ===== Test Supabase Connection =====
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ===== Login API for Postman testing =====
app.post('/api/user-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // ✅ Query Supabase users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password); // ⚠️ For demo only; hash in real app

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({ message: 'Login successful', user: users[0] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ===== Import Routes =====
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

// ===== Use Existing Routes =====
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
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
