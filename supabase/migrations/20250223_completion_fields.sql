-- Completion fields: defined on tasks, values stored per completion
-- Each field: type (number|text), label, tag (for chart display)

alter table tasks add column if not exists completion_fields jsonb default '[]';
-- Example: [{"type":"number","label":"How many pellets?","tag":"pellets"}]

alter table task_completions add column if not exists completion_values jsonb default '{}';
-- Example: {"pellets":5}
