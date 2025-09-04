export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen grid place-items-center bg-neutral-50">{children}</main>;
}