
 import { GoogleAuth } from "google-auth-library";
 import { env } from "../env";
 
 // Scope mínimo para Vertex AI
 const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];
 
 const auth = new GoogleAuth({ scopes: SCOPES });
 
 export async function getGoogleAccessToken(): Promise<string> {
   const client = await auth.getClient();
   const token = await client.getAccessToken();
   if (!token || !token.token) throw new Error("No se pudo obtener access token de Google");
   return token.token;
 }
