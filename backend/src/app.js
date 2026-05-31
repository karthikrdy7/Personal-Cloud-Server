const express = require('express');
const cors = require('cors');

const config = require('./config');
const rootRoutes = require('./routes');

const app = express();

const corsOptions = config.corsOrigins === true
	? {}
	: {
			origin: config.corsOrigins,
			methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
		};

// Allow requests from the browser, local network, and Tailscale clients.
app.use(cors(corsOptions));

// Parse JSON bodies for future API routes.
app.use(express.json({ limit: '10mb' }));

// Parse form submissions for future API routes.
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Keep route handlers separate from server startup logic.
app.use('/', rootRoutes);

// Keep missing routes and server errors consistent for deployment clients.
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: 'Route not found',
	});
});

app.use((error, req, res, next) => {
	const statusCode = error.statusCode || 500;

	if (config.nodeEnv !== 'production') {
		console.error(error);
	}

	res.status(statusCode).json({
		success: false,
		message: error.message || 'Internal server error',
	});
});

module.exports = app;