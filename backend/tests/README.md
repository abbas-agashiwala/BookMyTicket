# Testing checklist before release

Add automated integration tests against a dedicated MongoDB replica-set test database for:
- simultaneous requests attempting to hold the same show-seat pair (exactly one should succeed)
- expired hold reacquisition and stale owner rejection
- all-or-nothing multi-seat reservation rollback
- booking ownership and admin role authorization
- duplicate payment webhooks and idempotency
- show scheduling overlap prevention

The initial seat hold implementation uses a unique `(showId, seatId)` index and conditional atomic updates. For production, initialize inventory rows ahead of booking, use a carefully tested transaction strategy for multi-seat claims, and run the concurrency suite against your actual MongoDB Atlas topology. Payment verification/webhooks are intentionally not simulated as production-ready.
