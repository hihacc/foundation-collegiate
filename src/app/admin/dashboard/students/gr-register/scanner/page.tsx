'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GrRegisterScannerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard/students/gr-register');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs font-bold text-slate-500">
      Loading AI Ledger Scanner...
    </div>
  );
}
