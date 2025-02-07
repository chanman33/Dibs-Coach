Create a bucket in supabase storage called "resumes"

Then run the following command to set the policy for the bucket:

-- Ensure the "resumes" bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Allow applicants (MENTEE users) to upload their own resumes
CREATE POLICY "Allow MENTEE users to upload their resumes"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM "User"
        WHERE "User"."userId" = auth.uid()::text 
        AND "User".role = 'MENTEE'
    )
    -- Ensure file extension is PDF
    AND lower(substring(name from '\.([^\.]+)$')) = 'pdf'
);

-- Allow applicants to access only their own resumes
CREATE POLICY "Allow MENTEE users to access only their own resumes"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM "User"
        JOIN "CoachApplication" ON "User".id = "CoachApplication"."applicantDbId"
        WHERE "User"."userId" = auth.uid()::text
        AND position("User".id::text in name) = 1
    )
);

-- Allow ADMIN users to view all resumes
CREATE POLICY "Allow ADMIN users to view all resumes"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM "User"
        WHERE "User"."userId" = auth.uid()::text 
        AND "User".role = 'ADMIN'
    )
);

-- Create function to update resume URL in CoachApplication
CREATE OR REPLACE FUNCTION storage.update_coach_application_resume()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the user's database ID from their Clerk ID
    WITH user_info AS (
        SELECT id FROM "User" WHERE "userId" = auth.uid()::text LIMIT 1
    )
    UPDATE "CoachApplication"
    SET 
        "resumeUrl" = NEW.name,
        "updatedAt" = NOW()
    FROM user_info
    WHERE "CoachApplication"."applicantDbId" = user_info.id
    AND "CoachApplication".status = 'pending';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on storage.objects
CREATE TRIGGER update_coach_application_resume_trigger
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'resumes')
EXECUTE FUNCTION storage.update_coach_application_resume();
