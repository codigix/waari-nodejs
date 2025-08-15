const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====
const salesRoutes = require('./src/routes/sales.routes');
const adminRoutes = require('./src/routes/admin.routes');
const couponsRoutes = require("./src/routes/couponsRoutes");
const enquiryReportRoutes = require("./src/routes/enquiryReportRoutes");
const reportRoutes = require('./src/routes/reportRoutes');
const roleRoutes = require("./src/routes/roleRoutes");
const operationRoutes = require('./src/routes/operation.routes');
const accountsRoutes = require('./src/routes/accounts.routes');
const webRoutes = require('./src/routes/webRoutes');
const commonRoutes = require('./src/routes/common.routes');
const testRoutes = require('./src/routes/testRoute');
const tourRoutes = require('./src/routes/tourRoutes');

app.get('/', (req, res) => {
  res.send('Hello from Node.js + Socket.io');
});

// ===== Use routes =====
app.use("/api/sales", salesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupon", couponsRoutes);
app.use("/api/enquiry-report", enquiryReportRoutes);
app.use('/api/report', reportRoutes);
app.use("/api/role", roleRoutes);
app.use('/api/operations', operationRoutes);  
app.use('/api/accounts', accountsRoutes); 
app.use('/api', webRoutes);
app.use('/api/common', commonRoutes);
app.use('/api/test', testRoutes);
app.use('/api/tour', tourRoutes); 

// ===== Static uploads =====
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// ===== Socket.io connection =====
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// ===== Start server =====
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
