# NEXORA Security Specification

## 1. Data Invariants
1. **Default-Deny Baseline**: Every unspecified path in Firestore and Storage is denied (`allow read, write: if false`).
2. **Public Catalog Scoping**: Unauthenticated visitors may only query/read `products` with `publicationStatus` in `['Live', 'Coming Soon', 'Under Development']`, `categories` with `publicationStatus == 'Published'`, `updates` with `publicationStatus == 'Published'`, and `siteSettings/global`. Draft and Archived records are never returned to public queries.
3. **Strict PII Isolation**: `contactMessages` documents contain visitor names and emails and are strictly unreadable, unlistable, and non-updatable by non-administrators. Public visitors may only `create` with `status == 'New'`, empty `honeypot == ''`, valid email syntax, and server timestamps (`request.time`).
4. **Admin Privilege Boundary**: `administrators` records can only be created, modified, or deleted by existing verified administrators (bootstrapped owner email with `email_verified == true` or existing UID in `administrators`). Public users cannot self-elevate.
5. **Immutable Audit Timestamps**: `createdAt` is verified equal to `request.time` on creation and immutable (`incoming().createdAt == existing().createdAt`) on update. `updatedAt` must always equal `request.time`.
6. **Strict Schema Enforcement**: Every write is checked against `isValid[Entity]` with `keys().hasAll(...)` and `keys().hasOnly(...)`, string length bounds, ID regexes, and list size caps.

## 2. Adversarial "Dirty Dozen" Payloads (All Must Fail with PERMISSION_DENIED)
1. Public visitor attempting `getDocs(collection(db, 'products'))` without filtering out `Draft`/`Archived` products.
2. Public visitor attempting `getDoc(doc(db, 'products', 'draft-product-id'))` on a Draft product.
3. Unauthenticated or non-admin user attempting to `create` or `update` a product with `publicationStatus: 'Live'`.
4. Non-admin authenticated user attempting to write `administrators/{theirUid}` to grant themselves `Super Admin`.
5. Spoofed token matching admin email where `email_verified == false` attempting admin write.
6. Public visitor attempting `getDocs(collection(db, 'contactMessages'))` to scrape visitor emails.
7. Spam bot submitting `contactMessages` with non-empty `honeypot: "http://spam.example"` or `status: "Replied"`.
8. Shadow-field injection on `contactMessages` creation adding `isAdmin: true` or `extraField: "payload"`.
9. Resource poisoning: creating a product with `productId` of 500 characters or invalid characters (`../hack`).
10. Timestamp spoofing: submitting `createdAt: new Date('2020-01-01')` instead of `serverTimestamp()` (`request.time`).
11. Deleting `siteSettings/global` even as admin (`allow delete: if false`).
12. Overwriting `createdAt` during a product update.
