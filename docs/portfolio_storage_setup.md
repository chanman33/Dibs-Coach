# Portfolio Image Storage Setup

This document outlines the steps required to set up image storage for the portfolio feature in Supabase.

## Create the Bucket

First, create a storage bucket named "portfolio-images" in your Supabase project:

1. Navigate to the Supabase dashboard
2. Go to the Storage section
3. Click "New Bucket" 
4. Enter "portfolio-images" as the name
5. Set the bucket to public (check "Public" option)

## Set Up Storage Policies

Since we're using Clerk for authentication (not Supabase Auth), we need policies that allow:
1. Service role access for uploads (handled by our server actions)
2. Public read access for all images (portfolios are shown in public routes)

Run the following SQL commands in the Supabase SQL editor to create the appropriate policies:

```sql
-- Ensure the "portfolio-images" bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-images', 'portfolio-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: We're using Clerk auth, so we'll rely on service role access for uploads
-- All upload operations should use the service key through server actions
-- This removes the need for RLS policies for insert/update/delete operations

-- Allow public read access to all portfolio images
CREATE POLICY "Allow public read access to portfolio images"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'portfolio-images'
);
```

## Implementation Details

- For security, all upload operations must go through server actions using the service role key
- Images are organized by user ID from Clerk (stored as folder name)
- Each image is stored with a unique ID generated using ULID
- Original file extension is preserved
- Since bucket is public, all images will be accessible via their public URLs
- Security is ensured by:
  1. Server-side validation in the upload function 
  2. Using server actions with proper authentication checks
  3. Organizing files in user-specific folders
  4. Using unpredictable ULIDs for filenames

## Testing the Setup

1. Create the bucket with the settings and policies above
2. Use the `uploadPortfolioImage` function from server actions to test uploads
3. Verify that uploaded images are publicly accessible via their URLs

## Security Considerations

- Since we're using Clerk instead of Supabase Auth, we rely on application-level security
- Only authenticated users should be able to trigger the upload server action
- Service role is used for all storage operations
- Folder structure (user ID as folder) helps organize and identify image ownership 