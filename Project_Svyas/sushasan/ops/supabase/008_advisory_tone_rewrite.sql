-- 008_advisory_tone_rewrite.sql
--
-- Rewrites every stored solution brief from imperative/directive phrasing
-- ("Deploy 2 marshals…", "Direct SWM supervisor to…") into advisory,
-- co-partner phrasing ("One option is to deploy 2 marshals…"), so briefs read
-- as decision support prepared FOR the ward officer, never as orders to the
-- PMC. Originals are backed up to solutions_tone_backup before any change.
--
-- Idempotent: steps already starting with an advisory frame are skipped, and
-- the backup only inserts rows it doesn't already hold. Safe to re-run.

-- 1. Backup originals once.
create table if not exists solutions_tone_backup as
  select id, summary, steps, now() as backed_up_at from solutions;
insert into solutions_tone_backup (id, summary, steps, backed_up_at)
  select s.id, s.summary, s.steps, now() from solutions s
  where not exists (select 1 from solutions_tone_backup b where b.id = s.id);

-- 2. Rewrite step actions from imperative to advisory (verb-aware).
do $rewrite$
declare
  r record;
  new_steps jsonb;
  el jsonb;
  act text;
  clause text;
  rest text;
  fw text;
  idx int;
  changed boolean;
  verbs text[] := array[
    'Install','Deploy','Conduct','Repair','Replace','Paint','Re-time','Submit','Issue','Station',
    'Clear','Flush','Update','Execute','Assign','Dispatch','Inspect','Arrange','Repaint','Add',
    'Convene','Set','Remove','File','Coordinate','Revise','Engage','Place','Establish','Procure',
    'Reprogram','Post','Verify','Request','Designate','Patch','Recalibrate','Clean','Commission',
    'Erect','Register','Review','Relocate','Publish','Charter','Implement','Construct','Apply',
    'Adjust','Spray','Share','Schedule','Allocate','Direct','Demarcate','Follow','Print','Collect',
    'Complete','Reschedule','Lodge','Formalize','Obtain','Escalate','Close','Amend','Re-paint',
    'Monitor','Optimize','Reassign','Identify','Oversee','Reconfigure','Test','Formally','Affix',
    'Send','Audit','Install/repair','Authorize','Re-route','Hold','Sanitize','Requisition','Carry',
    'Provide','Lay','Write','Pump','Install/repaint','Propose','Instruct','Fix','Upgrade','Extend',
    'Organise','Organize','Launch','Hire','Mark','Build','Introduce','Restore','Desilt','Enforce',
    'Train','Prepare','Draft','Notify','Shift','Initiate','Activate','Begin','Start'
  ];
  prefixes text[] := array[
    'One option is to ',
    'The department may weigh the option to ',
    'Subject to the department''s assessment, one option is to '
  ];
  pfx text;
begin
  for r in select id, steps from solutions where jsonb_typeof(steps) = 'array' loop
    new_steps := '[]'::jsonb;
    idx := 0;
    changed := false;
    for el in select * from jsonb_array_elements(r.steps) loop
      act := el->>'action';
      if act is not null
         and act !~* '^(one option|the department may|subject to|the ward office|the corporator|a site verification|if the department|for a durable|once the ward office)' then
        clause := substring(act from '^((?:Based on|If|After|Through|Once|Where|Following)[^,]{1,90}, )');
        if clause is not null then
          rest := substring(act from char_length(clause) + 1);
        else
          rest := act;
        end if;

        if rest like 'Corporator to %' then
          rest := 'The corporator could ' || substring(rest from char_length('Corporator to ') + 1);
        elsif rest like 'Ward Corporator to %' then
          rest := 'The Ward Corporator could ' || substring(rest from char_length('Ward Corporator to ') + 1);
        elsif rest like 'Junior Engineer to %' then
          rest := 'The Junior Engineer could ' || substring(rest from char_length('Junior Engineer to ') + 1);
        elsif rest like 'MSEDCL to %' then
          rest := 'MSEDCL could ' || substring(rest from char_length('MSEDCL to ') + 1);
        elsif rest like 'SWM zonal officer to %' then
          rest := 'The SWM zonal officer could ' || substring(rest from char_length('SWM zonal officer to ') + 1);
        elsif rest like 'Zone officer to %' then
          rest := 'The zone officer could ' || substring(rest from char_length('Zone officer to ') + 1);
        elsif rest like 'The corporator''s office to %' then
          rest := 'The corporator''s office could ' || substring(rest from char_length('The corporator''s office to ') + 1);
        else
          fw := substring(rest from '^[A-Za-z/-]+');
          if fw is not null and exists (select 1 from unnest(verbs) v where lower(v) = lower(fw)) then
            if clause is not null then
              pfx := 'one option is to ';
            else
              pfx := prefixes[(idx % 3) + 1];
            end if;
            rest := pfx || lower(substring(rest from 1 for 1)) || substring(rest from 2);
          end if;
        end if;

        act := coalesce(clause, '') || rest;
        el := jsonb_set(el, '{action}', to_jsonb(act));
        changed := true;
      end if;
      new_steps := new_steps || jsonb_build_array(el);
      idx := idx + 1;
    end loop;
    if changed then
      update solutions set steps = new_steps where id = r.id;
    end if;
  end loop;
end
$rewrite$;

-- 3. Soften directive phrasing in summaries.
update solutions set summary =
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(summary,
          'intervention is required', 'intervention may be warranted', 'gi'),
        'is required', 'may be warranted', 'gi'),
      'requires immediate', 'may warrant prompt', 'gi'),
    'The corporator can ', 'The corporator''s office could ', 'g')
where summary ~* 'is required|requires immediate|The corporator can ';
