import { useRouter } from "next/router";

export default function JobsPage() {
  const router = useRouter();
  const projectId = (router.query.projectId as string) || "";
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Jobs del proyecto</h1>
      <p>projectId: <code>{projectId}</code></p>
      <div style={{ marginTop: 12, padding: 12, background: "#fffbcc", border: "1px solid #f7e08b" }}>
        Renderizado desde <b>Pages Router</b> (fallback). Cuando el App Router esté OK, borra este archivo.
      </div>
    </main>
  );
}
