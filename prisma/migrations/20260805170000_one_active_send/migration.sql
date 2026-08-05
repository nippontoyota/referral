-- Enforce the single active blast invariant under concurrent requests.
CREATE UNIQUE INDEX "send_jobs_one_active_idx"
ON "send_jobs" ((true))
WHERE "status" IN ('pending', 'running');
