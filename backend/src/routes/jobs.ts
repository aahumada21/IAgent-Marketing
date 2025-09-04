
 import { Router } from 'express';
 import { sbAdmin, getUserFromAuthHeader } from '../supabase.js';
 import { startVeo3Job } from '../providers/vertexVeo3.js';
 
 export const jobsRouter = Router();
 
 // Lanzar job en Vertex/Ve o3
 jobsRouter.post('/:id/launch', async (req, res) => {
   try {
     const user = await getUserFromAuthHeader(req.header('authorization') ?? '');
     if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
 
     const jobId = req.params.id;
     const { data: job, error } = await sbAdmin
       .from('content_jobs')
       .select('*')
       .eq('id', jobId)
       .single();
     if (error || !job) return res.status(404).json({ ok: false, error: 'Job not found' });
     if (job.created_by !== user.id) return res.status(403).json({ ok: false, error: 'Forbidden' });
     if (!job.input_media_url) return res.status(400).json({ ok: false, error: 'Missing input_media_url' });
     if (!job.prompt_text) return res.status(400).json({ ok: false, error: 'Missing prompt_text' });
 
     const { providerJobId, outputUrl } = await startVeo3Job(job.prompt_text, job.input_media_url);
 
     const patch: any = {
       provider_job_id: providerJobId ?? null,
       status: outputUrl ? 'completed' : 'running',
       output_media_url: outputUrl ?? null,
       error_message: null
     };
     const { error: updErr } = await sbAdmin.from('content_jobs').update(patch).eq('id', jobId);
     if (updErr) throw updErr;
 
     return res.json({ ok: true, job_id: jobId, status: patch.status, provider_job_id: providerJobId ?? null, output_media_url: outputUrl ?? null });
   } catch (err: any) {
     return res.status(500).json({ ok: false, error: err.message ?? 'Internal error' });
   }
 });

