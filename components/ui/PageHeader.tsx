interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">{title}</h1>
      {description && <p className="text-xl text-gray-600 max-w-2xl mx-auto">{description}</p>}
    </header>
  )
}

