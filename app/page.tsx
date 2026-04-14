import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
          Dashboard Alat
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Sistem manajemen alat dengan role-based access control
        </p>
        <Link href="/login">
          <Button size="lg" className="w-full sm:w-auto">
            Login ke Dashboard
          </Button>
        </Link>
        <div className="mt-12 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Fitur
          </h2>
          <ul className="text-left space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>✓ Autentikasi aman dengan password hashing</li>
            <li>✓ Session management dengan JWT</li>
            <li>✓ Role-based access control (3 role)</li>
            <li>✓ Protected routes dengan middleware</li>
            <li>✓ Responsive design dengan Tailwind CSS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
