-- Seed data for local/dev testing of the auth flow:
-- two mock households with different event visibility (including
-- per-guest differences within household 1), the real event schedule
-- (mirrors production -- see the 2026-09-14 Decision Log entry on fixing
-- the placeholder events), wardrobe/travel/FAQ content, and the initial
-- admin allowlist entry.

insert into admins (email) values
  ('hrishikesh.saraiya@gmail.com')
on conflict (email) do nothing;

insert into events (name, event_date, start_time, end_time, venue_name, address, dress_code, meal_info, description, extra_content)
values
  ('Haldi', '2027-05-29', '10:00', '13:00', 'Wyndham Grand Pittsburgh Downtown', '600 Commonwealth Pl, Pittsburgh, PA 15222', 'Sunny & relaxed -- light lehenga, sharara, kurta set, or breezy sari in daytime color', 'Brunch', 'A joyful morning of turmeric, family blessings, music, and brunch.',
    jsonb_build_object('wardrobe', jsonb_build_object(
      'title', 'Sunny & relaxed',
      'description', 'Try a light lehenga, sharara, kurta set, or breezy sari in cheerful daytime color.',
      'good_to_know', 'Choose breathable fabrics and easy shoes. Leave anything too precious at home because turmeric has a way of joining the celebration.',
      'palette', jsonb_build_array(
        jsonb_build_object('name','Marigold','hex','#e1b338'),
        jsonb_build_object('name','Sunshine','hex','#f2d574'),
        jsonb_build_object('name','Leaf green','hex','#75906b'),
        jsonb_build_object('name','Lotus pink','hex','#d98b91')
      )
    ))),
  ('Sangeet & Garba', '2027-05-29', '18:30', '22:30', 'Wyndham Grand Pittsburgh Downtown', '600 Commonwealth Pl, Pittsburgh, PA 15222', 'Colorful Indian festive -- lehenga, anarkali, embroidered kurta, or Nehru jacket', 'Dinner', 'An evening of performances, dinner, garba, and a very full dance floor.',
    jsonb_build_object('wardrobe', jsonb_build_object(
      'title', 'Colorful Indian festive',
      'description', 'Try a lehenga, anarkali, embroidered kurta, or Nehru jacket with color and movement.',
      'good_to_know', 'Garba-friendly shoes or a backup pair will make the dance floor much easier. Sparkle and embroidery are very welcome.',
      'palette', jsonb_build_array(
        jsonb_build_object('name','Berry','hex','#a33d54'),
        jsonb_build_object('name','Peacock blue','hex','#28687a'),
        jsonb_build_object('name','Marigold','hex','#d79324'),
        jsonb_build_object('name','Emerald','hex','#55715b')
      )
    ))),
  ('Wedding Ceremony', '2027-05-30', '09:30', '13:30', 'Wyndham Grand Pittsburgh Downtown', '600 Commonwealth Pl, Pittsburgh, PA 15222', 'Traditional or formal -- sari, silk lehenga, anarkali, sherwani, or bandhgala', 'Lunch', 'Join us for the ceremony, family traditions, and lunch together.',
    jsonb_build_object('wardrobe', jsonb_build_object(
      'title', 'Traditional or formal',
      'description', 'Try a sari, silk lehenga, anarkali, sherwani, or bandhgala for an elegant daytime celebration.',
      'good_to_know', 'Soft color, rich texture, and thoughtful tailoring are perfect. Polished Western formalwear is welcome too.',
      'palette', jsonb_build_array(
        jsonb_build_object('name','Dusty rose','hex','#cf8d91'),
        jsonb_build_object('name','Sage','hex','#6c8664'),
        jsonb_build_object('name','Antique gold','hex','#d6b464'),
        jsonb_build_object('name','Powder blue','hex','#87a8b3')
      )
    ))),
  ('Reception', '2027-05-30', '18:00', '23:00', 'Wyndham Grand Pittsburgh Downtown', '600 Commonwealth Pl, Pittsburgh, PA 15222', 'Formal eveningwear -- embellished sari, evening lehenga, bandhgala, or tuxedo', 'Cocktails & dinner', 'Cocktails, dinner, toasts, and one last night together on the dance floor.',
    jsonb_build_object('wardrobe', jsonb_build_object(
      'title', 'Formal eveningwear',
      'description', 'Try an embellished sari, evening lehenga, bandhgala, tuxedo, or another polished formal look.',
      'good_to_know', 'This is the dressiest event of the weekend. Choose something elevated that still leaves room for one last night on the dance floor.',
      'palette', jsonb_build_array(
        jsonb_build_object('name','Black','hex','#302927'),
        jsonb_build_object('name','Wine','hex','#722c36'),
        jsonb_build_object('name','Old gold','hex','#a9854f'),
        jsonb_build_object('name','Midnight blue','hex','#263f52')
      )
    )));

insert into travel_options (type, name, description) values
  ('hotel-block', 'Hotel 1', 'Our first room block option. Hotel details and a direct reservation link are coming soon.'),
  ('hotel-block', 'Hotel 2', 'Our second room block option. Hotel details and a direct reservation link are coming soon.'),
  ('hotel-block', 'Hotel 3', 'Our third room block option. Hotel details and a direct reservation link are coming soon.'),
  ('transport', 'Airport transportation', 'Transportation will not be provided between Pittsburgh International Airport and the venue or hotels. Please arrange a rideshare, taxi, rental car, or another personal transportation option. Allow about 30 minutes for the trip to downtown without heavy traffic.');

insert into faqs (question, answer, order_index) values
  ('Are children invited?', 'Children whose names appear in your household RSVP are invited.', 0),
  ('Can I bring a guest?', 'Your RSVP lists every person included with your invitation.', 1),
  ('Will the events be indoors?', 'Venue and weather-plan details will be confirmed closer to the weekend.', 2),
  ('Where should I stay?', 'Three hotel blocks are being arranged. Visit Travel & stay for each option and its booking details.', 3),
  ('Is airport transportation provided?', 'No. Please arrange your own transportation between Pittsburgh International Airport and the venue or hotels.', 4),
  ('What should I wear?', 'Visit the Wardrobe planner for event-by-event Indian outfit ideas, practical notes, and color palettes.', 5);

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

-- Household 1: Alex is invited to all four events, Jamie only to Haldi and
-- Wedding Ceremony -- demonstrates per-guest invitations differing within
-- the same household.
insert into guest_events (guest_id, event_id)
select g.id, e.id
from guests g
cross join events e
where g.first_name = 'Alex' and g.last_name = 'Placeholder';

insert into guest_events (guest_id, event_id)
select g.id, e.id
from guests g
join events e on e.name in ('Haldi', 'Wedding Ceremony')
where g.first_name = 'Jamie' and g.last_name = 'Placeholder';

-- Household 2 (single guest, Sam) is only invited to the Ceremony and Reception.
insert into guest_events (guest_id, event_id)
select g.id, e.id
from guests g
join events e on e.name in ('Wedding Ceremony', 'Reception')
where g.first_name = 'Sam' and g.last_name = 'Placeholder';
