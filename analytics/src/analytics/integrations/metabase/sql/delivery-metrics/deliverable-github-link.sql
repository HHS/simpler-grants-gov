SELECT
title, 
ghid, 
concat('https://github.com/', ghid) AS url 
FROM
gh_deliverable
WHERE
{{deliverable_title}}

