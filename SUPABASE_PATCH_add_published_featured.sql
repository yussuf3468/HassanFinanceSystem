-- Patch: add columns expected by the frontend filters/sort
-- Safe to run multiple times
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Optional: mark existing items as published and a couple featured for demo
UPDATE public.products SET published = true WHERE published IS DISTINCT FROM true;
-- Example: feature first 2 items by name order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) AS rn FROM public.products
)
UPDATE public.products p
SET featured = (r.rn <= 2)
FROM ranked r
WHERE r.id = p.id;
