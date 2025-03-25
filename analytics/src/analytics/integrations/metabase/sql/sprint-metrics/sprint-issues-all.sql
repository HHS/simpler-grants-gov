with

-- get sprint_id 
sprint_data as ( 
    select
        gh_sprint.id as sprint_id,
        gh_sprint.project_id,
        gh_sprint.name as sprint_name,
        gh_sprint.end_date as sprint_end_date
    from
        gh_sprint  
    inner join 
        gh_project ON gh_project.id = gh_sprint.project_id
    where
        {{sprint_name}}
        and
        {{project_ghid}}
),

-- get each issue_id in sprint 
issue_id_list as (
    select 
        distinct issue_id as issue_id,
        s.sprint_end_date
    from
        gh_issue_sprint_map m
    inner join 
        sprint_data s ON s.sprint_id = m.sprint_id
),

-- get metadata for each issue 
issue_data as (
    select
        i.id as issue_id, 
        i.title as issue_title,
        i.ghid as issue_ghid,
        issue_id_list.sprint_end_date
    from
        gh_issue i 
    inner join 
        issue_id_list ON issue_id_list.issue_id = i.id
    order by 
        issue_title 
),

-- get partition of issue history   
history_partition as (
    select 
        *
    from 
        gh_issue_history h
    inner join 
        gh_project ON gh_project.id = h.project_id
    where
        {{project_ghid}}
),

-- get state of issue at end of sprint 
issue_state as (

    select
        h.d_effective,
        h.issue_id,
        i.issue_title,
        i.issue_ghid,
        concat('https://github.com/', i.issue_ghid) as issue_url,
        h.status,
        h.points,
        i.sprint_end_date,
        case when h.points > 0 then '√' else null end as pointed
    from 
        history_partition h 
    inner join  
        issue_data i ON i.issue_id = h.issue_id
    where 
        (
            i.sprint_end_date < current_date 
            AND
            h.d_effective = i.sprint_end_date
        )
        OR 
        (
            i.sprint_end_date >= current_date  
            AND 
            h.d_effective = current_date - 1 
        )
    order by 
        h.issue_id 
)

select * from issue_state order by issue_title 

