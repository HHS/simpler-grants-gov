select *, 
case
when ghid = 13 then 'Nava'
when ghid = 17 then 'Agile Six'
end as scrum_board 
from gh_project
where ghid in (13,17)

