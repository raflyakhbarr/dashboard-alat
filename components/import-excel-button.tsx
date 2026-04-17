'use client';

import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface ImportExcelButtonProps {
  onClick?: () => void;
}

export function ImportExcelButton({ onClick }: ImportExcelButtonProps) {
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={onClick}
    >
      <Upload className="h-4 w-4" />
      Import Excel
    </Button>
  );
}
