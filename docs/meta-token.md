# Meta System User token (founder only)

The dashboard reads spend, impressions and clicks from your ad account. It
needs a **System User token** with **ads_read**. System User tokens can be
set to never expire, so you do this once.

Meta renames menus from time to time; if a label differs slightly, look for
the closest match.

## You need
- Admin access to your Meta Business Manager (business.facebook.com).
- A Meta app connected to that business. If you don't have one:
  developers.facebook.com > My Apps > Create app > type **Business** >
  connect it to your business. You don't need to publish it or submit it
  for review: reading your own ad account is allowed without review.

## Steps
1. Business Settings > **Users > System users** > **Add**. Name it
   `Sales Tracker`, role **Employee**.
2. Select the new system user > **Assign assets** > **Ad accounts** > pick
   your ad account > turn on **View performance** > Save.
3. Still on the system user: **Generate new token** > choose your app >
   expiry **Never** > permission **ads_read** > Generate.
4. Copy the token. You'll paste it **only** into the Sheet:
   **Sales Tracker > Connect Meta (founder only)**.
5. Your **ad account ID**: Ads Manager > account dropdown, the number under
   the account name (with or without `act_`).

## Check
The Sheet shows yesterday's spend after connecting. Compare it with Ads
Manager for the same day. If the Sheet says the currency or timezone
doesn't match, tell your assistant: Settings must match the ad account or
spend lands on the wrong days.

## Keep it safe
- Never paste the token into a chat, email, Slack or a file.
- If it leaks: Business Settings > System users > your user > revoke the
  token, generate a new one, and run **Connect Meta** again.
