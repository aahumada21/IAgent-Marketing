import 'dotenv/config';
 import express from 'express';
 import cors from 'cors';
 import pino from 'pino';
 import { jobsRouter } from './routes/jobs.js'; // ojo: extensión .js por "type": "module"
 
 const app = express();
 const log = pino();
 
 // CORS
 const allowed = (process.env.ALLOWED_ORIGINS ?? '')
   .split(',')
   .map(s => s.trim())
   .filter(Boolean);
 app.use(cors({ origin: allowed.length ? allowed : true }));
 
 app.use(express.json({ limit: '10mb' }));
 
 app.get('/health', (_req, res) => res.json({ ok: true, service: 'backend', ts: new Date().toISOString() }));
 app.use('/api/jobs', jobsRouter);
 
 const PORT = Number(process.env.PORT ?? 8080);
 app.listen(PORT, () => {
   log.info(`Backend listening on http://localhost:${PORT}`);
 });
