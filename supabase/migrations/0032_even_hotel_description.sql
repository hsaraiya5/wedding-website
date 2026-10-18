-- Copy update for the EVEN hotel card's description, as written by the couple.
-- Still editable afterwards on the admin Travel page.

update travel_options
set description = $d$A second option in downtown! We will have shuttles running between this hotel and Wyndham for all the events! Shuttle details will be communicated closer to the event!$d$
where name ilike 'EVEN Hotel%';
