-- Two more answers about the house, for the report's costs section.
--
-- Climate Home Inspection D56 (23 November 2026) adds a costs section: the
-- repair cost for each modelled storm, read on FEMA's Hazus depth-damage
-- curves. Those curves need the first floor's height above the ground and
-- whether there is a basement. 0010 already asks about the basement; this adds
-- the first-floor height (whole feet, 0..8, the form's choices) and whether the
-- basement is finished. Both are optional, a blank is null, and the report
-- prints them as the buyer's answers, never as measured.
--
-- Shape added to 0010's: {"first_floor_ft": 0..8|null,
--                         "basement_finished": "finished"|"unfinished"|null}

alter table public.report_orders
  drop constraint if exists report_orders_house_facts_shape;
alter table public.report_orders
  add constraint report_orders_house_facts_shape check (
    house_facts is null or (
      jsonb_typeof(house_facts) = 'object'
      and (house_facts->'basement' is null or house_facts->'basement' = 'null'::jsonb
           or house_facts->>'basement' in ('full', 'partial', 'none'))
      and (house_facts->'central_air' is null or jsonb_typeof(house_facts->'central_air') in ('boolean', 'null'))
      and (house_facts->'year_built' is null or jsonb_typeof(house_facts->'year_built') in ('number', 'null'))
      and (house_facts->'storeys' is null or jsonb_typeof(house_facts->'storeys') in ('number', 'null'))
      and (house_facts->'first_floor_ft' is null or house_facts->'first_floor_ft' = 'null'::jsonb
           or (jsonb_typeof(house_facts->'first_floor_ft') = 'number'
               and (house_facts->>'first_floor_ft')::numeric between 0 and 8))
      and (house_facts->'basement_finished' is null or house_facts->'basement_finished' = 'null'::jsonb
           or house_facts->>'basement_finished' in ('finished', 'unfinished'))
    )
  );
