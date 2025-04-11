interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
} 