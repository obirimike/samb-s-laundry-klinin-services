# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: communication.spec.ts >> WhatsApp and Phone Number Utility >> prepared booking WhatsApp message contains required details and excludes private information
- Location: tests\e2e\communication.spec.ts:84:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "SAMB Laundry & Cleaning Services"
Received string:    "Hello Ama Mensah,·
This is SAMB's LAUNDRY & KLININ Services.·
We are contacting you regarding your booking SAMB-2026-TEST1 for Deep Home Cleaning, scheduled for 15 November 2026 at 10:00.·
Please contact us if you have any questions.·
Thank you,
SAMB Laundry & Cleaning SERVICES."
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import {
  3   |   normalizePhoneNumber,
  4   |   formatPhoneNumberForWhatsApp,
  5   |   buildWhatsAppLink,
  6   |   buildWhatsAppUrl,
  7   |   buildBookingWhatsAppMessage,
  8   |   buildQuoteWhatsAppMessage,
  9   | } from "../../lib/whatsapp";
  10  | import {
  11  |   sendBookingStatusEmail,
  12  |   sendQuoteEmail,
  13  |   sendQuoteResponseEmail,
  14  | } from "../../lib/emails";
  15  | 
  16  | test.describe("WhatsApp and Phone Number Utility", () => {
  17  |   test("formats Ghanaian local numbers starting with 0 into international format (233...)", () => {
  18  |     expect(normalizePhoneNumber("0241234567")).toBe("233241234567");
  19  |     expect(normalizePhoneNumber("020 123 4567")).toBe("233201234567");
  20  |     expect(normalizePhoneNumber("055-987-6543")).toBe("233559876543");
  21  |     expect(normalizePhoneNumber("(024) 123-4567")).toBe("233241234567");
  22  |     expect(normalizePhoneNumber("030.123.4567")).toBe("233301234567");
  23  |   });
  24  | 
  25  |   test("handles Ghanaian numbers with +233, 233, or 00233 prefixes", () => {
  26  |     expect(normalizePhoneNumber("+233241234567")).toBe("233241234567");
  27  |     expect(normalizePhoneNumber("+233 24 123 4567")).toBe("233241234567");
  28  |     expect(normalizePhoneNumber("+233-(24)-123-4567")).toBe("233241234567");
  29  |     expect(normalizePhoneNumber("233241234567")).toBe("233241234567");
  30  |     expect(normalizePhoneNumber("00233241234567")).toBe("233241234567");
  31  |     expect(normalizePhoneNumber("00233 24 123 4567")).toBe("233241234567");
  32  |   });
  33  | 
  34  |   test("preserves valid international numbers when country code is provided", () => {
  35  |     expect(normalizePhoneNumber("+1 (415) 555-2671")).toBe("14155552671");
  36  |     expect(normalizePhoneNumber("+44 7911 123456")).toBe("447911123456");
  37  |     expect(normalizePhoneNumber("0044 7911 123456")).toBe("447911123456");
  38  |     expect(normalizePhoneNumber("+234 802 123 4567")).toBe("2348021234567");
  39  |   });
  40  | 
  41  |   test("rejects invalid, incomplete, ambiguous, or letters-containing phone numbers", () => {
  42  |     expect(normalizePhoneNumber(null)).toBeNull();
  43  |     expect(normalizePhoneNumber(undefined)).toBeNull();
  44  |     expect(normalizePhoneNumber("")).toBeNull();
  45  |     expect(normalizePhoneNumber("   ")).toBeNull();
  46  |     // Too short Ghanaian number:
  47  |     expect(normalizePhoneNumber("024123")).toBeNull();
  48  |     // Too long Ghanaian local number:
  49  |     expect(normalizePhoneNumber("024123456789")).toBeNull();
  50  |     // Ambiguous number without country code or Ghanaian local prefix:
  51  |     expect(normalizePhoneNumber("1234567")).toBeNull();
  52  |     expect(normalizePhoneNumber("5551234")).toBeNull();
  53  |     // Contains letters or disallowed characters:
  54  |     expect(normalizePhoneNumber("0241234567abc")).toBeNull();
  55  |     expect(normalizePhoneNumber("call 0241234567")).toBeNull();
  56  |     expect(normalizePhoneNumber("+233241234567#123")).toBeNull();
  57  |   });
  58  | 
  59  |   test("formatPhoneNumberForWhatsApp alias matches normalizePhoneNumber", () => {
  60  |     expect(formatPhoneNumberForWhatsApp("0241234567")).toBe(
  61  |       normalizePhoneNumber("0241234567")
  62  |     );
  63  |     expect(formatPhoneNumberForWhatsApp("invalid")).toBeNull();
  64  |   });
  65  | 
  66  |   test("builds valid WhatsApp Click-to-Chat URLs with encoded messages", () => {
  67  |     const message = "Hello Kofi,\nThis is SAMB.";
  68  |     const url = buildWhatsAppUrl("0241234567", message);
  69  |     expect(url).toBe(
  70  |       `https://wa.me/233241234567?text=${encodeURIComponent(message)}`
  71  |     );
  72  | 
  73  |     // Without message
  74  |     expect(buildWhatsAppUrl("0241234567")).toBe("https://wa.me/233241234567");
  75  | 
  76  |     // Invalid phone returns null
  77  |     expect(buildWhatsAppUrl("invalid", message)).toBeNull();
  78  |     expect(buildWhatsAppUrl(null, message)).toBeNull();
  79  | 
  80  |     // Alias matches
  81  |     expect(buildWhatsAppLink("0241234567", message)).toBe(url);
  82  |   });
  83  | 
  84  |   test("prepared booking WhatsApp message contains required details and excludes private information", () => {
  85  |     const bookingMessage = buildBookingWhatsAppMessage({
  86  |       customerName: "Ama Mensah",
  87  |       bookingNumber: "SAMB-2026-TEST1",
  88  |       serviceName: "Deep Home Cleaning",
  89  |       preferredDate: new Date("2026-11-15T00:00:00.000Z"),
  90  |       preferredTime: "10:00",
  91  |     });
  92  | 
  93  |     expect(bookingMessage).toContain("Hello Ama Mensah,");
  94  |     expect(bookingMessage).toContain("SAMB-2026-TEST1");
  95  |     expect(bookingMessage).toContain("Deep Home Cleaning");
  96  |     expect(bookingMessage).toContain("10:00");
> 97  |     expect(bookingMessage).toContain("SAMB Laundry & Cleaning Services");
      |                            ^ Error: expect(received).toContain(expected) // indexOf
  98  | 
  99  |     // Private operational info must not be included
  100 |     expect(bookingMessage).not.toContain("password");
  101 |     expect(bookingMessage).not.toContain("adminNotes");
  102 |     expect(bookingMessage).not.toContain("specialInstructions");
  103 |   });
  104 | 
  105 |   test("prepared quote WhatsApp message adapts according to status without exposing draft amounts", () => {
  106 |     // DRAFT status
  107 |     const draftMessage = buildQuoteWhatsAppMessage({
  108 |       customerName: "Kwame Asante",
  109 |       quoteNumber: "SAMB-Q-1001",
  110 |       bookingNumber: "SAMB-2026-TEST1",
  111 |       status: "DRAFT",
  112 |     });
  113 | 
  114 |     expect(draftMessage).toContain("Hello Kwame Asante,");
  115 |     expect(draftMessage).toContain("SAMB-Q-1001");
  116 |     expect(draftMessage).toContain("preparing your service quotation");
  117 |     // Must NOT contain amounts or draft pricing
  118 |     expect(draftMessage).not.toContain("GHS");
  119 |     expect(draftMessage).not.toContain("total");
  120 | 
  121 |     // SENT status
  122 |     const sentMessage = buildQuoteWhatsAppMessage({
  123 |       customerName: "Kwame Asante",
  124 |       quoteNumber: "SAMB-Q-1001",
  125 |       bookingNumber: "SAMB-2026-TEST1",
  126 |       status: "SENT",
  127 |       appUrl: "https://samb.example.com",
  128 |     });
  129 | 
  130 |     expect(sentMessage).toContain("Hello Kwame Asante,");
  131 |     expect(sentMessage).toContain("SAMB-Q-1001");
  132 |     expect(sentMessage).toContain("https://samb.example.com/account/quotes");
  133 | 
  134 |     // ACCEPTED status
  135 |     const acceptedMessage = buildQuoteWhatsAppMessage({
  136 |       customerName: "Kwame Asante",
  137 |       quoteNumber: "SAMB-Q-1001",
  138 |       status: "ACCEPTED",
  139 |     });
  140 |     expect(acceptedMessage).toContain("accepting service quotation");
  141 | 
  142 |     // DECLINED status
  143 |     const declinedMessage = buildQuoteWhatsAppMessage({
  144 |       customerName: "Kwame Asante",
  145 |       quoteNumber: "SAMB-Q-1001",
  146 |       status: "DECLINED",
  147 |     });
  148 |     expect(declinedMessage).toContain("noted your response");
  149 | 
  150 |     // EXPIRED status
  151 |     const expiredMessage = buildQuoteWhatsAppMessage({
  152 |       customerName: "Kwame Asante",
  153 |       quoteNumber: "SAMB-Q-1001",
  154 |       status: "EXPIRED",
  155 |     });
  156 |     expect(expiredMessage).toContain("expired");
  157 | 
  158 |     // WITHDRAWN status
  159 |     const withdrawnMessage = buildQuoteWhatsAppMessage({
  160 |       customerName: "Kwame Asante",
  161 |       quoteNumber: "SAMB-Q-1001",
  162 |       status: "WITHDRAWN",
  163 |     });
  164 |     expect(withdrawnMessage).toContain("withdrawn");
  165 |   });
  166 | });
  167 | 
  168 | test.describe("Optional Email Notification System", () => {
  169 |   const originalApiKey = process.env.RESEND_API_KEY;
  170 |   const originalFrom = process.env.EMAIL_FROM;
  171 | 
  172 |   test.afterEach(() => {
  173 |     if (originalApiKey !== undefined) {
  174 |       process.env.RESEND_API_KEY = originalApiKey;
  175 |     } else {
  176 |       delete process.env.RESEND_API_KEY;
  177 |     }
  178 | 
  179 |     if (originalFrom !== undefined) {
  180 |       process.env.EMAIL_FROM = originalFrom;
  181 |     } else {
  182 |       delete process.env.EMAIL_FROM;
  183 |     }
  184 |   });
  185 | 
  186 |   test("skips booking status email gracefully when RESEND_API_KEY is missing", async () => {
  187 |     delete process.env.RESEND_API_KEY;
  188 |     process.env.EMAIL_FROM = "test@example.com";
  189 | 
  190 |     const result = await sendBookingStatusEmail({
  191 |       to: "customer@example.com",
  192 |       customerName: "Test Customer",
  193 |       bookingNumber: "SAMB-TEST",
  194 |       status: "CONFIRMED",
  195 |     });
  196 | 
  197 |     expect(result.success).toBe(false);
```