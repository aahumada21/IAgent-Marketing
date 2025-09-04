
 import { VertexAI } from '@google-cloud/vertexai';
 
 const PROJECT = process.env.GCP_PROJECT_ID!;
 const LOCATION = process.env.GCP_LOCATION ?? 'us-central1';
 
 if (!PROJECT) throw new Error('Falta GCP_PROJECT_ID');
 
 const vertex_ai = new VertexAI({ project: PROJECT, location: LOCATION });
 const model = vertex_ai.getGenerativeModel({ model: 'google/veo-3' });
 
 export async function startVeo3Job(prompt: string, imageUrl: string) {
   const req: any = {
     contents: [
       {
         role: 'user',
         parts: [
           { text: prompt },
           { fileData: { mimeType: 'image/png', fileUri: imageUrl } }
         ]
       }
     ],
     generationConfig: { temperature: 0.7 }
   };
   const res = await model.generateContent(req);
   const out = await res.response;
   const outputUrl =
     out?.candidates?.[0]?.content?.parts?.find((p: any) => p?.fileData?.fileUri)?.fileData?.fileUri ??
     out?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData)?.inlineData?.mimeType
       ? null
       : null;
 
   return {
     providerJobId: null, // si Vertex te da ID de operación, ponlo acá
     outputUrl,
     raw: out
   };
 }

