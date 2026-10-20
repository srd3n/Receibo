# Security Specification: TallyReceipt Firebase Rules

## 1. Data Invariants
- Every user profile `/users/{userId}` can only be read and written by the authenticated user whose `request.auth.uid == userId`.
- Every expense record `/users/{userId}/expenses/{expenseId}` strictly belongs to `userId`. An authenticated user cannot read, list, create, update, or delete expenses belonging to any other user.
- Expenses must have a valid `id`, `receiptNumber`, `merchant`, `date`, `category`, positive `amount`, and `paymentMethod`.
- The `userId` in the payload must strictly match `request.auth.uid` and path `{userId}`.
- All IDs must pass `isValidId()` regex and boundary checks.

## 2. Dirty Dozen Threat Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user123` with `auth == null` -> DENIED.
2. **Cross-Tenant Read**: User A (`auth.uid == 'userA'`) reading `/users/userB/expenses/exp1` -> DENIED.
3. **Cross-Tenant Write**: User A writing `/users/userB/expenses/exp1` -> DENIED.
4. **Id Spoofing**: User A creating expense with `data.userId == 'userB'` -> DENIED.
5. **Path Poisoning**: Target operation with malicious 1KB non-alphanumeric path ID -> DENIED.
6. **Negative Amount Injection**: Creating an expense with `amount <= 0` or NaN -> DENIED.
7. **Missing Required Fields**: Creating expense missing `merchant` or `category` -> DENIED.
8. **Malicious Ghost Fields**: Sending unauthorized unexpected keys -> DENIED.
9. **Query Scraping Without Owner Filter**: Running an open list without user boundary -> DENIED.
10. **Tampering User ID on Update**: Attempting to change `userId` during update -> DENIED.
11. **Excessive String Length Attack**: Merchant string > 256 characters -> DENIED.
12. **PII Leakage**: Non-owner accessing `/users/{userId}` -> DENIED.
