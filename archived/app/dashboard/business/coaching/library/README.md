# Training Library Management System - COMING SOON

This document outlines the implementation of the Training Library Management System for business portals. This system allows managers to curate, assign, and track learning content for their team members.

## Core Features

### Content Management
- Browse the existing DIBS learning library
- Upload custom content (videos, articles, PDFs)
- Create structured courses with multiple sections
- Tag content by domain, difficulty, and required skills

### Team Assignment
- Assign content to individual team members or groups
- Set due dates and priority levels
- Create role-based learning paths
- Send notifications for new assignments

### Progress Tracking
- Dashboard showing team completion rates
- Individual progress reports
- View detailed analytics on team learning

## Technical Implementation

### Database Schema
We use Prisma for schema management and migrations, while all database interactions are handled through Supabase:

```prisma
// Main resources
model TrainingResource {
  id             String   @id @default(uuid())
  title          String
  description    String
  type           String   // "article", "video", "course", etc.
  access         String   // "free", "premium", "affiliate", etc.
  url            String?
  thumbnail      String?
  partner        String?
  status         String?  // "published", "draft", "coming_soon", etc.
  // Relationships
  organization   Organization?
  domains        ResourceDomain[]
  assignments    ResourceAssignment[]
}

// Resource assignment tracking
model ResourceAssignment {
  id           String   @id @default(uuid())
  resource     TrainingResource
  user         User
  assignedBy   User
  status       String   // "assigned", "in_progress", "completed"
  progress     Int      // Progress percentage
  completedAt  DateTime?
}
```

### API Architecture
- Server actions for all data operations (`/utils/actions/training-library-actions.ts`)
- Uses Supabase for database queries
- Secure role-based access control

### UI Components
- Training Library Dashboard with tabs for:
  - Browse Content: View the entire resource library
  - Manage Content: Create/edit organization-specific resources
  - Team Progress: Track team member completion status
- Content filtering by domain, type, and access level
- Team member progress tracking and notifications

## Implementation Files

- `app/dashboard/business/coaching/library/page.tsx`: Main dashboard UI
- `app/dashboard/business/coaching/library/columns.tsx`: Data table definitions
- `utils/actions/training-library-actions.ts`: Server actions for data operations
- `prisma/schema.prisma`: Database schema definitions

## Future Enhancements

1. **Content Assessments**: Quizzes and tests to verify knowledge retention
2. **Learning Paths**: Create sequenced learning tracks for different roles
3. **Certifications**: Issue completion certificates for courses
4. **Analytics Dashboard**: Detailed reporting on team learning metrics
5. **Content Recommendations**: AI-driven content suggestions based on role and progress

## Getting Started

To use the Training Library Management system:

1. Navigate to the business portal
2. Select the "Library" tab from the navigation
3. Browse existing content or add your own
4. Assign resources to team members
5. Track completion through the "Team Progress" tab 