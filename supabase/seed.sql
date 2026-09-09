-- Seed data for local/dev testing of the auth flow:
-- two mock households with different event visibility, four placeholder
-- events (W/X/Y/Z), and the initial admin allowlist entry.

insert into admins (email) values
  ('hrishikesh.saraiya@gmail.com')
on conflict (email) do nothing;

insert into events (name, event_date, start_time, end_time, venue_name, address, dress_code, meal_info, description)
values
  ('Event W', '2027-04-02', '10:00', '13:00', 'Placeholder Venue W', '123 Placeholder St, Sample City', 'Casual', 'Lunch', 'Placeholder description for Event W.'),
  ('Event X', '2027-04-03', '18:00', '22:00', 'Placeholder Venue X', '456 Placeholder Ave, Sample City', 'Festive', 'Dinner', 'Placeholder description for Event X.'),
  ('Event Y', '2027-04-04', '11:00', '14:00', 'Placeholder Venue Y', '789 Placeholder Blvd, Sample City', 'Traditional', 'Lunch', 'Placeholder description for Event Y.'),
  ('Event Z', '2027-04-04', '19:00', '23:00', 'Placeholder Venue Z', '321 Placeholder Rd, Sample City', 'Formal', 'Dinner', 'Placeholder description for Event Z.');

insert into households (display_name, code, contact_email)
values
  ('Mock Guest Household 1', 'mockguest1', 'mockguest1@example.com'),
  ('Mock Guest Household 2', 'mockguest2', 'mockguest2@example.com');

-- Guests within each household.
insert into guests (household_id, first_name, last_name)
select h.id, g.first_name, g.last_name
from households h
join (values
  ('Mock Guest Household 1', 'Jamie', 'Placeholder'),
  ('Mock Guest Household 1', 'Alex', 'Placeholder'),
  ('Mock Guest Household 2', 'Sam', 'Placeholder')
) as g(household_display_name, first_name, last_name)
  on g.household_display_name = h.display_name;

-- Household 1 is invited to all four events (W, X, Y, Z).
insert into household_events (household_id, event_id)
select h.id, e.id
from households h
cross join events e
where h.display_name = 'Mock Guest Household 1';

-- Household 2 is only invited to Y and Z.
insert into household_events (household_id, event_id)
select h.id, e.id
from households h
join events e on e.name in ('Event Y', 'Event Z')
where h.display_name = 'Mock Guest Household 2';
