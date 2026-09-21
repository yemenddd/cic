-- Connect the feed entries that already exist to the announcement that
-- produced them.
--
-- Rows written before Notification.announcementId existed carry no link, which
-- would leave every announcement sent so far unmanageable: withdrawing one
-- would remove nothing from anybody's feed, and correcting one would correct
-- nothing.
--
-- Matched on the title, restricted to ANNOUNCEMENT notifications, and where a
-- title was reused the announcement closest at or before the notification's
-- own timestamp wins. The minute of slack absorbs the gap between the
-- announcement row being written and the last batch of notifications landing,
-- which for a large send is real.
--
-- This is a heuristic, and exactly as good as the information recorded at the
-- time — which is the reason the column exists from here on. Anything it
-- cannot match is left null and simply stays unmanaged, rather than being
-- attached to the wrong announcement.
UPDATE "Notification" n
SET "announcementId" = (
  SELECT a."id"
  FROM "Announcement" a
  WHERE a."title" = n."title"
    AND a."createdAt" <= n."createdAt" + INTERVAL '1 minute'
  ORDER BY a."createdAt" DESC
  LIMIT 1
)
WHERE n."kind" = 'ANNOUNCEMENT'
  AND n."announcementId" IS NULL;
