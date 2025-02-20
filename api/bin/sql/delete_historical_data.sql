-- Start transaction
BEGIN;

-- First verify counts of what we'll delete - for validation
SELECT 'Link Funding Instrument Historical Records' as table_name, COUNT(*) as count_to_delete 
FROM api.link_opportunity_summary_funding_instrument li 
JOIN api.opportunity_summary os ON li.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Link Funding Category Historical Records' as table_name, COUNT(*) as count_to_delete 
FROM api.link_opportunity_summary_funding_category lc
JOIN api.opportunity_summary os ON lc.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Link Applicant Type Historical Records' as table_name, COUNT(*) as count_to_delete 
FROM api.link_opportunity_summary_applicant_type la
JOIN api.opportunity_summary os ON la.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Opportunity Summary Historical Records' as table_name, COUNT(*) as count_to_delete 
FROM api.opportunity_summary 
WHERE revision_number IS NOT NULL;

-- Delete from link tables first - referencing opportunity_summary
DELETE FROM api.link_opportunity_summary_funding_instrument li
USING api.opportunity_summary os
WHERE li.opportunity_summary_id = os.opportunity_summary_id 
AND os.revision_number IS NOT NULL;

DELETE FROM api.link_opportunity_summary_funding_category lc
USING api.opportunity_summary os
WHERE lc.opportunity_summary_id = os.opportunity_summary_id 
AND os.revision_number IS NOT NULL;

DELETE FROM api.link_opportunity_summary_applicant_type la
USING api.opportunity_summary os
WHERE la.opportunity_summary_id = os.opportunity_summary_id 
AND os.revision_number IS NOT NULL;

-- Then delete from opportunity_summary
DELETE FROM api.opportunity_summary 
WHERE revision_number IS NOT NULL;

-- Verify counts after deletion (should all be 0)
SELECT 'Remaining Link Funding Instrument Historical Records' as table_name, COUNT(*) as remaining_count 
FROM api.link_opportunity_summary_funding_instrument li 
JOIN api.opportunity_summary os ON li.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Remaining Link Funding Category Historical Records' as table_name, COUNT(*) as remaining_count 
FROM api.link_opportunity_summary_funding_category lc
JOIN api.opportunity_summary os ON lc.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Remaining Link Applicant Type Historical Records' as table_name, COUNT(*) as remaining_count 
FROM api.link_opportunity_summary_applicant_type la
JOIN api.opportunity_summary os ON la.opportunity_summary_id = os.opportunity_summary_id 
WHERE os.revision_number IS NOT NULL;

SELECT 'Remaining Opportunity Summary Historical Records' as table_name, COUNT(*) as remaining_count 
FROM api.opportunity_summary 
WHERE revision_number IS NOT NULL;

-- If everything looks good, commit the transaction
-- If not, ROLLBACK instead
COMMIT;