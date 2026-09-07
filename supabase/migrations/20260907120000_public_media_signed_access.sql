-- Public visibility is granted by the application only after a parent is published.
-- Keeping the bucket private prevents direct storage URLs from bypassing that check.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set public = false,
        file_size_limit = 26214400,
        allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm']
    where id = 'public-media';
  end if;
end $$;
