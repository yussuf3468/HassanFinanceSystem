-- CREATE STORAGE BUCKET FOR PRODUCT IMAGES
-- Run this in your Supabase SQL Editor

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies to allow public access
CREATE POLICY "Allow public uploads to product-images"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public downloads from product-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow public updates to product-images"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes from product-images"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'product-images');