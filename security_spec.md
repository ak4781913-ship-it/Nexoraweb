# MAWA Security Specification

## 1. Data Invariants
1. **Default-Deny Baseline**: Every unspecified path in Firestore and Storage is denied (`allow read, write: if false`).
2. **Public Catalog Scoping**: Unauthenticated visitors may only query/read `products` with `publicationStatus` in `['Live', 'Coming Soon', 'Under Development']`, `categories` with `publicationStatus == 'Published'`, `updates` with `publicationStatus == 'Published'`, `roadmapItems` with `isPublic == true`, `downloadItems` with `publicationStatus == 'Published'`, `productReviews` with `status == 'Approved'`, and `siteSettings/global`. Draft, Hidden, Pending, Rejected, and Archived records are never returned to public queries.
3. **Strict PII Isolation**: `contactMessages` and `newsletterSubscribers` contain visitor emails/names and are strictly unreadable and unlistable by non-administrators. Public visitors may only create `contactMessages` with `status == 'New'`, empty `honeypot`, valid email, and `request.time`. Newsletter subscribers use deterministic SHA-256 email doc IDs so duplicate subscriptions and self-service unsubscribe work without any public `get`/`list` PII exposure.
4. **Tiered Admin Privilege Boundary (Super Admin vs. Editor)**:
   - Verified `Editor` or `Super Admin` (`isAdmin()`): manage products, categories, updates, roadmap, downloads, reviews moderation, recycle bin archiving/restoration, and contact message triage.
   - Strict `Super Admin` (`isSuperAdmin()`): manage `administrators` roster/roles, modify `siteSettings/global` critical config, manage `backups`, permanently delete records (`products`, `categories`, `updates`, `recycleBin`, `newsletterSubscribers`, `contactMessages`), and delete files in Firebase Storage.
5. **Immutable Audit & Analytics**: `activityLogs` are append-only (`allow update, delete: if false`) bound to `adminUid == request.auth.uid`. `analyticsEvents` accept anonymous non-PII traffic telemetry only and reject updates/deletes.
6. **Review Moderation Gate**: Public visitors can only submit `productReviews` with `status == 'Pending'` and `honeypot == ''`; unmoderated reviews never appear on public pages.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. Public visitor attempting `getDocs(collection(db, 'products'))` without scoping to public statuses.
2. Public visitor attempting `getDoc(doc(db, 'products', 'draft-product-id'))` on a Draft product.
3. Unauthenticated or non-admin user attempting to write `products`, `roadmapItems`, `downloadItems`, or `siteSettings/global`.
4. Verified `Editor` attempting to modify `siteSettings/global`, create/update/delete `administrators`, create/restore `backups`, or permanently delete from `recycleBin`.
5. Non-admin authenticated user attempting to write `administrators/{theirUid}` to grant themselves `Super Admin`.
6. Spoofed token matching admin email where `email_verified == false` attempting any admin read/write.
7. Public visitor attempting `getDocs(collection(db, 'contactMessages'))` or `getDocs(collection(db, 'newsletterSubscribers'))` to scrape emails.
8. Visitor submitting a `productReview` with `status: 'Approved'` directly (bypassing moderation) or rating `99`.
9. Spam bot submitting `contactMessages`, `productReviews`, or `newsletterSubscribers` with non-empty `honeypot`.
10. Shadow-field injection adding unexpected fields (`extraField: "payload"`, `isAdmin: true`).
11. Resource poisoning: creating a document with an invalid ID (`../hack` or >128 chars) or oversized strings.
12. Timestamp spoofing (`createdAt != request.time`) or overwriting immutable `createdAt` / `activityLogs` records.
