'use client';

import { Input } from './input';
import { Label } from './label';

interface FileUploadProps {
  id: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export function FileUpload({ id, accept, maxSize = 10, onFileSelect, error }: FileUploadProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onFileSelect(null);
      return;
    }

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="file"
        accept={accept}
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
} 