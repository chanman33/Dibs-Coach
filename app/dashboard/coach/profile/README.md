# Coach Profile Page Implementation

This document outlines the implementation of the Coach Profile page, which allows coaches to set up and manage their profile information.

## Architecture

The Coach Profile page is built using a tab-based interface that dynamically shows relevant tabs based on the user's role and selected domain specialties. The implementation follows these key principles:

1. **Unified State Management**: Uses a context provider (`ProfileContext`) to manage state across all tabs
2. **Progressive Disclosure**: Shows/hides tabs based on user capabilities and selected specialties
3. **Completion Tracking**: Tracks form completion status across all tabs
4. **Domain-specific Components**: Organizes industry-specific components in separate directories

## Component Structure

### Main Components

- `ProfileProvider`: Context provider for unified state management
- `ProfilePageContent`: Main content component that uses the context
- `ProfileTabsManager`: Manages the tabs and their visibility
- `CoachProfileForm`: Form for coach-specific information
- Domain-specific forms (e.g., `RealtorProfileForm`, `InvestorProfileForm`)
- `RecognitionsSection`: For managing professional recognitions
- `MarketingInfo`: For marketing-related information
- `GoalsForm`: For setting and tracking goals

### Tab Structure

The profile page includes the following tabs:

1. **General**: Basic user information (always visible)
2. **Coach Profile & Specialties**: Coach-specific information (visible for users with COACH capability)
3. **Domain-specific Tabs**: Shown based on selected specialties (e.g., Realtor, Investor)
4. **Professional Recognitions**: Awards and achievements (visible for users with COACH capability)
5. **Marketing Info**: Marketing-related information (visible for users with COACH capability)
6. **Goals**: Goals and objectives (visible for users with COACH capability)

## Data Flow

1. The `ProfileProvider` fetches initial data and provides it to all components
2. Each tab component receives relevant data and update functions from the context
3. When a user selects domain specialties in the Coach Profile tab, the corresponding domain-specific tabs are shown
4. Form submissions update the context state and persist data to the server
5. Completion status is calculated based on required fields across all forms

## Implementation Details

### State Management

The `ProfileContext` manages:
- General profile data
- Coach profile data
- Domain-specific data
- Professional recognitions
- Marketing info
- Goals data
- Status information (completion percentage, missing fields)
- Loading states
- User capabilities and selected specialties

### Dynamic Tab Rendering

The `ProfileTabsManager` component:
- Defines all possible tabs
- Filters tabs based on user capabilities and selected specialties
- Renders only the tabs that are relevant to the user

### Form Submission

Each form component:
- Receives initial data from the context
- Validates user input
- Submits data to the context update functions
- Shows success/error messages

## Usage

To use this implementation:

1. Ensure the user has the appropriate capabilities set in the database
2. Navigate to the Coach Profile page
3. Fill out the General Profile tab
4. Complete the Coach Profile tab, selecting domain specialties
5. Fill out domain-specific tabs based on selected specialties
6. Complete Professional Recognitions, Marketing Info, and Goals tabs
7. Publish the profile when all required fields are completed

## Future Improvements

Potential improvements to consider:

1. **Form Validation**: Enhance validation with more detailed error messages
2. **Auto-save**: Implement auto-saving for form fields
3. **Preview Mode**: Add a preview mode to see how the profile will appear to others
4. **Completion Guidance**: Provide more guidance on completing the profile
5. **Performance Optimization**: Optimize data fetching and state updates 