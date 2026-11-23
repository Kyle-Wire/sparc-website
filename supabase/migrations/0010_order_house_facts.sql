-- What the buyer tells us about the house.
--
-- Data-licence decision, 23 November 2026 (Climate Home Inspection D53):
-- reports use only open data. The City of Philadelphia's assessor's records
-- (basement, central air, storeys) are not cleared for commercial use, so the
-- order form asks the buyer instead. Every answer is optional; a blank is
-- stored as null and the report says it was not given. The report prints them
-- as the buyer's answers, never as inspected facts.
--
-- Shape: {"basement": "full"|"partial"|"none"|null, "central_air": true|false|null,
--         "year_built": 1700..next year|null, "storeys": 1..6|null}

alter table public.report_orders
  add column if not exists house_facts jsonb;

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
    )
  );
