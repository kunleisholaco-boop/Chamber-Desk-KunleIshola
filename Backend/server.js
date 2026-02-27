const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/cases', require('./routes/caseRoutes'));
app.use('/api/funds', require('./routes/fundRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/broadcasts', require('./routes/broadcastRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/client-portal', require('./routes/clientPortalRoutes'));

app.get('/', (req, res) => {
    res.send('Chamber Desk Backend is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
