import { NextResponse } from "next/server";

export async function POST() {
  // Simula crear un job en cola y devolver su id
  const jobId = `demo-${Math.random().toString(36).slice(2, 8)}`;
  // En un caso real, aquí encolarías en Redis/QStash y guardarías en DB
  return NextResponse.json({ jobId });
}
