SELECT title,
       ghid,
       concat('https://github.com/', ghid) AS url,
       id
FROM gh_issue
WHERE {{ghid}}
LIMIT 1