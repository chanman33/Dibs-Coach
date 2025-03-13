-- Seed data for EnterpriseLeads table
-- This file contains mock data for development purposes

-- Clear existing data (optional, comment out if you want to keep existing data)
DELETE FROM "EnterpriseLeads";

-- Insert mock leads data
INSERT INTO "EnterpriseLeads" (
  "ulid", 
  "companyName", 
  "website", 
  "industry", 
  "fullName", 
  "jobTitle", 
  "email", 
  "phone", 
  "teamSize", 
  "multipleOffices", 
  "status", 
  "priority", 
  "notes", 
  "lastContactedAt", 
  "nextFollowUpDate", 
  "createdAt", 
  "updatedAt"
) VALUES
-- Lead 1: New high priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNOPQ', 
  'Skyline Realty Group', 
  'https://skylinerealty.com', 
  'REAL_ESTATE_SALES', 
  'Michael Johnson', 
  'Director of Operations', 
  'michael@skylinerealty.com', 
  '(555) 123-4567', 
  '20-50', 
  true, 
  'NEW', 
  'HIGH', 
  '[{"id": "note1", "content": "Initial contact made through website inquiry", "createdAt": "2023-11-01T10:30:00Z", "createdBy": "system", "type": "NOTE"}]', 
  NULL, 
  '2023-11-15T14:00:00Z', 
  '2023-11-01T10:00:00Z', 
  '2023-11-01T10:00:00Z'
),

-- Lead 2: Contacted medium priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNOP2', 
  'Horizon Mortgage Solutions', 
  'https://horizonmortgage.com', 
  'MORTGAGE_LENDING', 
  'Sarah Williams', 
  'VP of Sales', 
  'sarah@horizonmortgage.com', 
  '(555) 234-5678', 
  '50-100', 
  true, 
  'CONTACTED', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Initial call completed, interested in team coaching", "createdAt": "2023-10-15T11:30:00Z", "createdBy": "system", "type": "CALL"}, {"id": "note2", "content": "Sent follow-up email with pricing information", "createdAt": "2023-10-20T09:15:00Z", "createdBy": "system", "type": "EMAIL"}]', 
  '2023-10-20T09:15:00Z', 
  '2023-11-10T10:00:00Z', 
  '2023-10-15T09:00:00Z', 
  '2023-10-20T09:15:00Z'
),

-- Lead 3: Qualified high priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNOP3', 
  'Elite Property Management', 
  'https://elitepm.com', 
  'PROPERTY_MANAGEMENT', 
  'David Chen', 
  'CEO', 
  'david@elitepm.com', 
  '(555) 345-6789', 
  '20-50', 
  false, 
  'QUALIFIED', 
  'HIGH', 
  '[{"id": "note1", "content": "Discovery call completed, good fit for enterprise plan", "createdAt": "2023-10-05T14:00:00Z", "createdBy": "system", "type": "CALL"}, {"id": "note2", "content": "Scheduled demo with management team", "createdAt": "2023-10-10T11:30:00Z", "createdBy": "system", "type": "MEETING"}]', 
  '2023-10-10T11:30:00Z', 
  '2023-11-05T15:00:00Z', 
  '2023-10-01T08:00:00Z', 
  '2023-10-10T11:30:00Z'
),

-- Lead 4: Proposal stage medium priority
(
  '01HJK2T5ABCDEFGHIJKLMNOP4', 
  'Cornerstone Investments', 
  'https://cornerstoneinv.com', 
  'REAL_ESTATE_INVESTMENT', 
  'Jennifer Lopez', 
  'Managing Director', 
  'jennifer@cornerstoneinv.com', 
  '(555) 456-7890', 
  '5-20', 
  false, 
  'PROPOSAL', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Proposal sent for team of 15 agents", "createdAt": "2023-09-25T16:45:00Z", "createdBy": "system", "type": "EMAIL"}, {"id": "note2", "content": "Client requested additional information on coaching curriculum", "createdAt": "2023-09-28T10:20:00Z", "createdBy": "system", "type": "EMAIL"}]', 
  '2023-09-28T10:20:00Z', 
  '2023-11-02T11:00:00Z', 
  '2023-09-20T13:30:00Z', 
  '2023-09-28T10:20:00Z'
),

-- Lead 5: Negotiation stage high priority
(
  '01HJK2T5ABCDEFGHIJKLMNOP5', 
  'Premier Title & Escrow', 
  'https://premiertitle.com', 
  'TITLE_ESCROW', 
  'Robert Smith', 
  'President', 
  'robert@premiertitle.com', 
  '(555) 567-8901', 
  '20-50', 
  true, 
  'NEGOTIATION', 
  'HIGH', 
  '[{"id": "note1", "content": "Negotiating contract terms, client wants custom training modules", "createdAt": "2023-09-15T13:00:00Z", "createdBy": "system", "type": "MEETING"}, {"id": "note2", "content": "Revised proposal sent with custom training options", "createdAt": "2023-09-18T15:30:00Z", "createdBy": "system", "type": "EMAIL"}]', 
  '2023-09-18T15:30:00Z', 
  '2023-10-30T14:00:00Z', 
  '2023-09-10T09:45:00Z', 
  '2023-09-18T15:30:00Z'
),

-- Lead 6: Won deal
(
  '01HJK2T5ABCDEFGHIJKLMNOP6', 
  'Guardian Insurance Group', 
  'https://guardianins.com', 
  'INSURANCE', 
  'Amanda Taylor', 
  'COO', 
  'amanda@guardianins.com', 
  '(555) 678-9012', 
  '50-100', 
  true, 
  'WON', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Contract signed for 12-month coaching program", "createdAt": "2023-09-05T11:15:00Z", "createdBy": "system", "type": "NOTE"}, {"id": "note2", "content": "Kickoff meeting scheduled for next week", "createdAt": "2023-09-08T14:20:00Z", "createdBy": "system", "type": "MEETING"}]', 
  '2023-09-08T14:20:00Z', 
  NULL, 
  '2023-08-15T10:30:00Z', 
  '2023-09-08T14:20:00Z'
),

-- Lead 7: Lost deal
(
  '01HJK2T5ABCDEFGHIJKLMNOP7', 
  'Metropolitan Commercial', 
  'https://metrocommercial.com', 
  'COMMERCIAL', 
  'Thomas Wilson', 
  'Director of Training', 
  'thomas@metrocommercial.com', 
  '(555) 789-0123', 
  '100+', 
  true, 
  'LOST', 
  'LOW', 
  '[{"id": "note1", "content": "Client decided to go with internal training program", "createdAt": "2023-08-28T09:45:00Z", "createdBy": "system", "type": "CALL"}, {"id": "note2", "content": "Send follow-up in 6 months to check on results", "createdAt": "2023-08-28T10:00:00Z", "createdBy": "system", "type": "NOTE"}]', 
  '2023-08-28T09:45:00Z', 
  '2024-02-28T10:00:00Z', 
  '2023-08-10T13:15:00Z', 
  '2023-08-28T10:00:00Z'
),

-- Lead 8: Archived lead
(
  '01HJK2T5ABCDEFGHIJKLMNOP8', 
  'Legacy Lending Partners', 
  'https://legacylending.com', 
  'PRIVATE_CREDIT', 
  'Richard Brown', 
  'Managing Partner', 
  'richard@legacylending.com', 
  '(555) 890-1234', 
  '5-20', 
  false, 
  'ARCHIVED', 
  'LOW', 
  '[{"id": "note1", "content": "Company acquired by larger firm, no longer a fit", "createdAt": "2023-07-20T11:30:00Z", "createdBy": "system", "type": "NOTE"}]', 
  '2023-07-20T11:30:00Z', 
  NULL, 
  '2023-07-01T09:00:00Z', 
  '2023-07-20T11:30:00Z'
),

-- Lead 9: New low priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNOP9', 
  'Coastal Realty Associates', 
  'https://coastalrealty.com', 
  'REAL_ESTATE_SALES', 
  'Emily Davis', 
  'Team Lead', 
  'emily@coastalrealty.com', 
  '(555) 901-2345', 
  '5-20', 
  false, 
  'NEW', 
  'LOW', 
  '[{"id": "note1", "content": "Inbound inquiry from website contact form", "createdAt": "2023-10-25T16:00:00Z", "createdBy": "system", "type": "NOTE"}]', 
  NULL, 
  '2023-11-20T10:00:00Z', 
  '2023-10-25T16:00:00Z', 
  '2023-10-25T16:00:00Z'
),

-- Lead 10: Contacted low priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNO10', 
  'Innovative Mortgage Solutions', 
  'https://innovativemortgage.com', 
  'MORTGAGE_LENDING', 
  'Kevin Martinez', 
  'Branch Manager', 
  'kevin@innovativemortgage.com', 
  '(555) 012-3456', 
  '5-20', 
  false, 
  'CONTACTED', 
  'LOW', 
  '[{"id": "note1", "content": "Initial outreach email sent", "createdAt": "2023-10-18T13:45:00Z", "createdBy": "system", "type": "EMAIL"}, {"id": "note2", "content": "Left voicemail, no response yet", "createdAt": "2023-10-22T11:30:00Z", "createdBy": "system", "type": "CALL"}]', 
  '2023-10-22T11:30:00Z', 
  '2023-11-05T09:00:00Z', 
  '2023-10-18T13:45:00Z', 
  '2023-10-22T11:30:00Z'
),

-- Lead 11: Qualified medium priority lead
(
  '01HJK2T5ABCDEFGHIJKLMNO11', 
  'Prestige Property Management', 
  'https://prestigepm.com', 
  'PROPERTY_MANAGEMENT', 
  'Olivia Wilson', 
  'Operations Director', 
  'olivia@prestigepm.com', 
  '(555) 123-4567', 
  '20-50', 
  true, 
  'QUALIFIED', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Completed needs assessment call", "createdAt": "2023-10-12T14:30:00Z", "createdBy": "system", "type": "CALL"}, {"id": "note2", "content": "Interested in coaching for property managers", "createdAt": "2023-10-12T15:00:00Z", "createdBy": "system", "type": "NOTE"}]', 
  '2023-10-12T14:30:00Z', 
  '2023-11-01T13:00:00Z', 
  '2023-10-05T10:15:00Z', 
  '2023-10-12T15:00:00Z'
),

-- Lead 12: Proposal stage high priority
(
  '01HJK2T5ABCDEFGHIJKLMNO12', 
  'Summit Investment Group', 
  'https://summitinvest.com', 
  'REAL_ESTATE_INVESTMENT', 
  'Daniel Park', 
  'CEO', 
  'daniel@summitinvest.com', 
  '(555) 234-5678', 
  '20-50', 
  true, 
  'PROPOSAL', 
  'HIGH', 
  '[{"id": "note1", "content": "Detailed proposal sent for executive coaching", "createdAt": "2023-10-08T16:00:00Z", "createdBy": "system", "type": "EMAIL"}, {"id": "note2", "content": "Client reviewing with board of directors", "createdAt": "2023-10-15T11:45:00Z", "createdBy": "system", "type": "CALL"}]', 
  '2023-10-15T11:45:00Z', 
  '2023-10-29T14:00:00Z', 
  '2023-10-01T09:30:00Z', 
  '2023-10-15T11:45:00Z'
),

-- Lead 13: Negotiation stage medium priority
(
  '01HJK2T5ABCDEFGHIJKLMNO13', 
  'Reliable Title Services', 
  'https://reliabletitle.com', 
  'TITLE_ESCROW', 
  'Sophia Lee', 
  'Managing Director', 
  'sophia@reliabletitle.com', 
  '(555) 345-6789', 
  '20-50', 
  false, 
  'NEGOTIATION', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Discussing contract terms and payment schedule", "createdAt": "2023-09-28T13:30:00Z", "createdBy": "system", "type": "MEETING"}, {"id": "note2", "content": "Client requested monthly payment option", "createdAt": "2023-10-05T10:00:00Z", "createdBy": "system", "type": "EMAIL"}]', 
  '2023-10-05T10:00:00Z', 
  '2023-10-20T15:30:00Z', 
  '2023-09-20T11:00:00Z', 
  '2023-10-05T10:00:00Z'
),

-- Lead 14: Won deal high priority
(
  '01HJK2T5ABCDEFGHIJKLMNO14', 
  'Secure Insurance Brokers', 
  'https://secureinsurance.com', 
  'INSURANCE', 
  'William Johnson', 
  'Sales Director', 
  'william@secureinsurance.com', 
  '(555) 456-7890', 
  '50-100', 
  true, 
  'WON', 
  'HIGH', 
  '[{"id": "note1", "content": "Contract signed for enterprise coaching package", "createdAt": "2023-09-22T15:45:00Z", "createdBy": "system", "type": "NOTE"}, {"id": "note2", "content": "Implementation meeting scheduled", "createdAt": "2023-09-25T11:30:00Z", "createdBy": "system", "type": "MEETING"}]', 
  '2023-09-25T11:30:00Z', 
  NULL, 
  '2023-09-01T10:00:00Z', 
  '2023-09-25T11:30:00Z'
),

-- Lead 15: Lost deal medium priority
(
  '01HJK2T5ABCDEFGHIJKLMNO15', 
  'Urban Commercial Properties', 
  'https://urbancommercial.com', 
  'COMMERCIAL', 
  'Jessica Miller', 
  'HR Director', 
  'jessica@urbancommercial.com', 
  '(555) 567-8901', 
  '50-100', 
  true, 
  'LOST', 
  'MEDIUM', 
  '[{"id": "note1", "content": "Budget constraints, will reconsider next fiscal year", "createdAt": "2023-09-15T14:00:00Z", "createdBy": "system", "type": "CALL"}, {"id": "note2", "content": "Set reminder to follow up in Q1 2024", "createdAt": "2023-09-15T14:30:00Z", "createdBy": "system", "type": "NOTE"}]', 
  '2023-09-15T14:00:00Z', 
  '2024-01-15T10:00:00Z', 
  '2023-08-25T09:15:00Z', 
  '2023-09-15T14:30:00Z'
);

-- Add more leads as needed 