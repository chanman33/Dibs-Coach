'use client';

import { useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  id: string;
  maxSize?: number; // in MB
  previewUrl?: string;
  onFileSelect: (file: File | null) => void;
  onClear?: () => void;
  error?: string;
  className?: string;
}

export function ImageUpload({
  id,
  maxSize = 5,
  previewUrl,
  onFileSelect,
  onClear,
  error,
  className
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    console.log("[IMAGE_UPLOAD_FILE_CHANGE]", {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      timestamp: new Date().toISOString()
    });
    
    if (!file) {
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      console.log("[IMAGE_UPLOAD_INVALID_TYPE]", {
        type: file.type,
        allowed: allowedTypes,
        timestamp: new Date().toISOString()
      });
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Validate file size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      console.log("[IMAGE_UPLOAD_TOO_LARGE]", {
        size: file.size,
        maxSize: maxSize * 1024 * 1024,
        timestamp: new Date().toISOString()
      });
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Call parent's handler with the file object
    console.log("[IMAGE_UPLOAD_VALID_FILE]", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      objectUrl,
      timestamp: new Date().toISOString()
    });
    
    onFileSelect(file);
    
    // We'll clean up the object URL on unmount via useEffect
  };

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview && !previewUrl) {
        console.log("[IMAGE_UPLOAD_CLEANUP]", {
          preview,
          timestamp: new Date().toISOString()
        });
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview, previewUrl]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFileChange(file || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    setPreview(null);
    onFileSelect(null);
    if (onClear) onClear();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {preview ? (
        <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
          <Image 
            src={preview} 
            alt="Image preview" 
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={handleClear}
              className="h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors", 
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            error ? "border-red-500" : ""
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-2 rounded-full bg-primary/10">
              <ImagePlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Upload an image</p>
              <p className="text-xs text-muted-foreground">Drag & drop or click to browse</p>
            </div>
            <Input
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleInputChange}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => document.getElementById(id)?.click()}
              className="mt-2"
            >
              <UploadCloud className="h-4 w-4 mr-2" />
              Select Image
            </Button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
} 