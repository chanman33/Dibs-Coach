# Standardized Loading Components

This directory contains standardized loading components for consistent loading UIs across the application.

## Components

| Component | Purpose | Use Case |
|-----------|---------|----------|
| `Spinner` | Base spinner component | For direct use or as building block |
| `FullPageLoading` | Full page loading with optional logo | For route transitions, initial loads |
| `ContainerLoading` | Container/section loading | For cards, sections, or partial content |
| `InlineLoading` | Inline text/button loading | For buttons, inline elements |

## Importing

Always import from the index file:

```tsx
import { Spinner, FullPageLoading, ContainerLoading, InlineLoading } from '@/components/loading';
```

## Component Usage

### Spinner

The foundational component that others build upon:

```tsx
import { Spinner } from '@/components/loading';

<Spinner 
  size="md" // "xs" | "sm" | "md" | "lg" | "xl"
  color="primary" // "default" | "primary" | "secondary" | "muted"
/>
```

### FullPageLoading

For full-page loading states:

```tsx
import { FullPageLoading } from '@/components/loading';

<FullPageLoading 
  message="Loading your content..." // Optional message
  showLogo={true} // Show/hide logo
  spinnerSize="lg" // "sm" | "md" | "lg" | "xl"
  spinnerColor="primary" // "default" | "primary" | "secondary" | "muted"
  minHeight="min-h-screen" // Custom height
/>
```

### ContainerLoading

For loading states in cards, sections, and containers:

```tsx
import { ContainerLoading } from '@/components/loading';

<ContainerLoading 
  message="Loading data..." // Optional message
  spinnerSize="md" // "xs" | "sm" | "md" | "lg"
  spinnerColor="primary" // "default" | "primary" | "secondary" | "muted"
  minHeight="min-h-[200px]" // Custom height
  padding="p-4" // Custom padding
/>
```

### InlineLoading

For buttons and inline elements:

```tsx
import { InlineLoading } from '@/components/loading';

<Button disabled={isLoading}>
  {isLoading ? (
    <InlineLoading 
      text="Saving..." // Optional text
      spinnerSize="xs" // "xs" | "sm"
      spinnerColor="inherit" // "default" | "primary" | "secondary" | "muted" | "inherit"
    />
  ) : (
    "Save"
  )}
</Button>
```

## Where to Use Each Component

1. **FullPageLoading**: Use in Next.js `loading.tsx` files or when loading an entire page/main content
2. **ContainerLoading**: Use in cards, sections, or any container where you're loading part of the UI
3. **InlineLoading**: Use in buttons during form submission or any inline loading state
4. **Spinner**: Use directly when you need just a spinner without text or container

## Migration Guide

1. Replace custom spinner implementations with `Spinner`
2. Replace full-page loading states with `FullPageLoading`
3. Replace container loading states with `ContainerLoading`
4. Replace button loading states with `InlineLoading`

Remember to update import statements across files to ensure consistency. 