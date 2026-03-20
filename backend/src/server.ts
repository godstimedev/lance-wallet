import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './db/connection.js';
import { logger } from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const startServer = async () => {
	try {
		await pool.query('SELECT 1');
		logger.info('Database connection successful');
		app.listen(PORT, () => {
			logger.info(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		logger.info(`Failed to connect to the database: ${error}`);
		process.exit(1);
	}
};

startServer();
