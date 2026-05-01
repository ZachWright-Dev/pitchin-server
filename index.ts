import express from 'express';

const app = express();
app.use(express.json());


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

app.get('/', (req, res) => {
    res.send("Hello from PitchIn server!!!");
});

app.listen(PORT, () => {
    console.log(`PitchIn server is listening on port ${PORT}`);
});