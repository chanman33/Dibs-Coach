'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ComingSoonProps {
  title?: string;
  description?: string;
  className?: string;
  showImage?: boolean;
}

export function ComingSoon({
  title = 'Coming Soon',
  description = 'This feature is currently under development. Stay tuned for updates!',
  className,
  showImage = true,
}: ComingSoonProps) {
  return (
    <Card className={cn('w-full p-6 flex flex-col items-center justify-center gap-4', className)}>
      {showImage && (
        <div className="relative w-48 h-48 mb-4">
          <Image
            src="/images/coming-soon.svg"
            alt="Coming Soon"
            fill
            className="object-contain"
            priority
          />
        </div>
      )}
      <h2 className="text-2xl font-semibold text-center text-primary">{title}</h2>
      <p className="text-center text-muted-foreground max-w-md">{description}</p>
    </Card>
  );
}
