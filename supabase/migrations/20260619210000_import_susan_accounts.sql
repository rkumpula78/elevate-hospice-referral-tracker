-- Import Susan Harken's referral-source accounts (20 organizations).
-- Source: 'Susan Accounts - contact info..xlsx', cleaned/spell-checked and addresses verified.
-- Idempotent: each row inserted only if an organization with the same name does not already exist.
-- assigned_marketer = 'Susan Harken'. GPS lat/long left null (populated by geocode-address on next edit).

INSERT INTO public.organizations
  (name, type, address, city, state, zip_code, phone, contact_person, partnership_notes, assigned_marketer, is_active)
SELECT v.name, v.type, v.address, v.city, v.state, v.zip_code, v.phone, v.contact_person, v.partnership_notes, 'Susan Harken', true
FROM (VALUES
  ('Desert Breeze Group Home', 'assisted_living', '4823 E Apache Cir, Phoenix, AZ 85044', 'Phoenix', 'AZ', '85044', '623-398-5059', 'Chenica (Main Caregiver) 602-617-5396', 'Owner: Yvette'),
  ('Blue Sky Manor Group Home', 'assisted_living', '1510 W 5th Pl, Mesa, AZ 85201', 'Mesa', 'AZ', '85201', '480-208-8839', 'Tammy 480-338-0866', 'Owner: Hal. Managed by A Paradise for Parents'),
  ('Tempe Post Acute', 'nursing_home', '6100 S Rural Rd, Tempe, AZ 85283', 'Tempe', 'AZ', '85283', '(480) 831-8660', 'Brittney (Case Management)', 'Owner: Corporation. Skilled nursing (Ensign-affiliated)'),
  ('Senior Helpers of Gilbert & Chandler', 'caregiver_services', '604 W Warner Rd, Ste B2, Chandler, AZ 85225', 'Chandler', 'AZ', '85225', '480-870-9939', 'James (owner/contact)', 'Owner: James. Home-care franchise serving Ahwatukee/East Valley'),
  ('Angel''s Adult Group Home', 'assisted_living', '15462 S 47th Pl, Phoenix, AZ 85044', 'Phoenix', 'AZ', '85044', '480-889-4288', 'Abel (owner/contact)', 'Owner: Abel. Ahwatukee'),
  ('Mosaic Gardens Memory Care at Chandler', 'assisted_living', '850 S Pennington Dr, Chandler, AZ 85224', 'Chandler', 'AZ', '85224', '(480) 769-8101', 'Carol / Z', 'Owner: Corporation'),
  ('Ironwood Cancer & Research Centers', 'clinic', '695 S Dobson Rd, Chandler, AZ 85224', 'Chandler', 'AZ', '85224', '480-481-7761', 'Dayana Romero 480-481-7761', 'Owner: Corporation. Oncology, multi-location; Dobson Rd Chandler campus'),
  ('Bethesda Gardens Phoenix', 'assisted_living', '13825 N Cave Creek Rd, Phoenix, AZ 85022', 'Phoenix', 'AZ', '85022', '602-765-4000', 'Darlynn Seely (Health Services Director)', 'Owner: Corporation'),
  ('Mayfair Eden Homes', 'assisted_living', '210 S 98th Way, Mesa, AZ 85208', 'Mesa', 'AZ', '85208', '480-674-9206', 'Lorraine 480-765-0973', 'Owner: Maddie. Multi-home operator; licensed homes at 210 & 216 S 98th Way'),
  ('Lavender Lane Senior Living', 'assisted_living', '6033 E Arbor Ave, Mesa, AZ 85206', 'Mesa', 'AZ', '85206', '928-864-0654', NULL, 'Owner: Corporation. Formerly Arbor Rose Senior Living (renamed after 2026 Pennant Group acquisition)'),
  ('Springdale Village', 'assisted_living', '7255 E Broadway Rd, Bldg 7, Mesa, AZ 85208', 'Mesa', 'AZ', '85208', '480-482-7300', 'Eliza Solarez 480-388-9291', 'Owner: Corporation'),
  ('Sunshine Village', 'assisted_living', '2606 E Greenway Pkwy, Phoenix, AZ 85032', 'Phoenix', 'AZ', '85032', '602-765-7400', 'Jovonne Gooden 480-589-0938', 'Owner: Corporation. A ViewPoint Senior Care Community'),
  ('Scottsdale Comfort Assisted Living', 'assisted_living', '12558 N 76th St, Scottsdale, AZ 85260', 'Scottsdale', 'AZ', '85260', '623-570-0066', 'Lydia 623-570-0066', 'Owner: Lydia'),
  ('Cactus Corridor Assisted Living', 'assisted_living', '10865 E Sahuaro Dr, Scottsdale, AZ 85259', 'Scottsdale', 'AZ', '85259', '480-620-0748', 'Diana Marc 480-620-0748', 'Owner: Romina & James'),
  ('R&R East Valley Care Homes', 'assisted_living', '1271 N Kingston St, Gilbert, AZ 85233', 'Gilbert', 'AZ', '85233', '480-828-0498', '480-828-0498', 'Owner: Jeanette, Monica. Multi-location (6 homes, Mesa/Gilbert); Heritage Manor anchor address - confirm corporate HQ'),
  ('Vi at Silverstone', 'assisted_living', '22605 N 74th St, Scottsdale, AZ 85255', 'Scottsdale', 'AZ', '85255', '480-478-6208', 'Marc Conpleti (Asst DON)', 'Owner: Corporation. Care Center address; main campus office 23005 N 74th St'),
  ('City of Phoenix - Fire Administration / Human Relations Commission', 'referral_source', '150 S 12th St, Phoenix, AZ 85034', 'Phoenix', 'AZ', '85034', '480-228-5025', 'Barb Thomas', 'Owner: Government. Fire/HRC building (per request). Note: Human Services Dept HQ is at 200 W Washington St'),
  ('Oak Street Health', 'clinic', '1940 W Indian School Rd, Ste 1, Phoenix, AZ 85015', 'Phoenix', 'AZ', '85015', '602-782-1880', 'Sheri Whinery', 'Owner: Corporation. Medicare primary care; multi-location (Encanto Village clinic shown)'),
  ('Home Matters Caregiving of North Scottsdale', 'caregiver_services', '9375 E Shea Blvd, Ste 100, Scottsdale, AZ 85260', 'Scottsdale', 'AZ', '85260', '480-360-3500', 'Stephanie Nesbitt', 'Multi-location brand; North Scottsdale office'),
  ('Connections In Home Care, LLC', 'home_health', '3509 E Shea Blvd, Ste 102, Phoenix, AZ 85028', 'Phoenix', 'AZ', '85028', '602-448-8534', 'Leah Stefani', 'dba ''Connections In Homecare & Communities''')
) AS v(name, type, address, city, state, zip_code, phone, contact_person, partnership_notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.name = v.name
);
