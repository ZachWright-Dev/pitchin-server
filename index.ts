import express from 'express';
import authenticate from './middleware/authenticate';
import cors from 'cors';
import dashboardRoutes from './routes/dashboardRoutes';
import groupRoutes from './routes/groupRoutes';
import userRoutes from './routes/userRoutes';

const app = express();
app.use(express.json());
app.use(cors({ origin: ['http://localhost:3000']}));


if (!process.env.PORT) {
    console.error("Please specify a PORT for this server!");
    process.exit(1);
}

// Check if port is a number
if (!/^\d+$/.test(process.env.PORT)) {
    console.error(`PORT must be a number, got: "${process.env.PORT}"`);
    process.exit(1);
}

const PORT: number = parseInt(process.env.PORT, 10);

app.use(authenticate);
app.use('/dashboard', dashboardRoutes);
app.use('/user', userRoutes);
app.use('/group', groupRoutes);
app.get('/', (_req, res) => {
    res.send("Hello from PitchIn server!!!");
});

app.listen(PORT, () => {
    console.log(`PitchIn server is listening on port ${PORT}`);
});