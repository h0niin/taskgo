# TaskGo Prototype Walkthrough

## ## 2. Sign in

This mock sign-in screen also offers one-tap demo logins:

| Role | Demo account | Password |
|---|---|---|
| Customer | `customer@taskgo.in` | `customer123` |
| Tasker | `runner@taskgo.in` | `runner123` |
| Dual-mode demo/ | `dual@taskgo.in` | `dual123` |

Use the **Dual** account to switch between **Customer Mode** and **Tasker Mode** from the app header. The Profile tab also has a simulator switch, which create tasker bids automatically (u can ignore it).

## 3. Customer workflow

### Post an errand

1. Open **Post Task** from the bottom tab bar, or use **Post New Errand** on the Errands dashboard.
2. Choose a category: Pickups & Drop-offs, Store Purchases, Document Work, Device Repairs, Urgent Business Errand, or Custom Task. Custom Task requires a description.
3. Enter the pickup and final drop-off. You can search for any place and a suggestion box will appear with real locations corresponding to your search. (But incase the suggestion box doesnt come. it defaults to `Kozhikode` -> `NIT Calicut` for the sake of prototype). There is a `current location` shortcut button on the side that selects NIT Calicut. Add intermediate stops with **Add Stop / Location** and remove intermediate stops as needed. A route must have at least a pickup and drop-off.
4. Optionally add landmarks and a contact person for stops, special instructions, a load weight and estimated duration, and up to three reference photos from the camera or gallery.
5. Submit the errand. The app checks for a category and non-empty stop addresses, calculates a distance estimate, derives a base price, then opens the new order detail. No price is charged at posting time.

### Review quotes and negotiate

The **Errands** dashboard shows active orders, status counts/filters, received bid counts, and a live progress card for an assigned errand. Select an order to open its details, including route checkpoints, instructions, attachments, bid inbox, and route preview.

For each quote, open its thread to see the chronological offers and notes. When a Tasker has made a pending offer, the customer can:

- **Accept** the quote and lock in that Tasker.
- **Send Counter** with a price and note. The counter must meet the displayed base price; the customer UI allows up to 5 counter rounds.
- **Reject Bid** to close that Tasker’s thread.

Once an offer is accepted, other bid threads are closed and the order waits for payment.

### Pay and track

The initial checkout displays the agreed service fee plus a ₹60 platform fee. Tap the UPI action to open the demo payment sheet and confirm the simulated payment. The order then becomes assigned and the customer can view the Tasker, route preview, status, and ETA label in the order detail and dashboard.

The order detail also provides a call action and a cancellation action while the order is awaiting payment or assigned/in progress. Cancelling before task payment is shown as no-charge. Cancelling after payment/dispatch requires confirmation and is presented as forfeiting the agreed fee. Cancellation is not offered once proof has been submitted.

### Review completion proof and settle extra costs

When the Tasker submits proof, open **Review Proof Photos & Bill** from the order detail:

1. Inspect the completion photo and, if present, the additional-cost photo and amount.
2. **Approve Proof** to complete the order if there are no additional costs.
3. If additional costs were submitted, approval moves the order to an additional-payment step. Pay that amount through the demo UPI sheet to complete the order.
4. Use **Raise Issue / Query Proof** to flag a concern. The demo requires an issue description, but the current app only displays a local issue flag; it does not create a support ticket.

The completed order unlocks a paper-style receipt with the route, Tasker, service fee, platform fee, any additional costs, payment references/timestamps, and total. Customers can choose a 1–5 star rating, add feedback, and save or update it. Completed and cancelled orders appear under **Profile → Errand History**.

## 4. Tasker workflow

### Find and bid on errands

1. Sign in as a Tasker, or choose **Tasker Mode** with the Dual account.
2. Open **Errand Feed**. The online switch controls availability; open tasks are shown with category, distance, route checkpoints, instructions, bid count, and any existing bid status. Pull down to refresh.
3. Select an errand to inspect all checkpoints, instructions, customer attachments, and the call action.
4. Place a positive-amount bid with a short reasoning note (maximum 120 characters). Bids below the order’s calculated floor are rejected by the app.
5. Before the customer responds, you can edit or withdraw your bid. Open your negotiation thread to accept a customer counter, send another counter, or reject it.

### Complete assigned errands

Open **My Errands** to see your bidding threads, active assignments, and completed work. Use the status filter to narrow the list. Assigned tasks show route information, a map preview, customer attachments, contact action, and a completion action.

When the work is done, tap **Task Completed** and submit a required completion photo using the camera or gallery. If you incurred extra costs, turn on the additional-cost option and attach its proof photo and positive amount. The order moves to customer proof review; after approval and any additional payment, it appears in the completed list.

Completed cards show the service fee and additional costs separately, total Tasker earnings (excluding the platform fee), and any customer rating/review.

## 5. One-device end-to-end demo

To try the complete customer journey without a second Tasker device:

1. Sign in with the Dual demo account.
2. Keep the header in **Customer Mode** and post an errand.
3. Switch to **Tasker Mode** and place a bid. Open the order’s bid thread and accept the quote (or try countering).
4. Complete the demo UPI checkout. Submit the completion proof.
5. Review and approve the proof. Approve and complete the additional-cost payment to reach the receipt. 

I suggest you ignore the simulator toggle (might have bugs) in profile and do switch between tasker and customer manually.

## 6. Local operations dashboard

The admin dashboard refreshes its operations view every two seconds. It includes:

- Summary metrics for open tasks, online Taskers, tasks needing attention, and tasks completed today.
- A searchable, status-filterable task table showing task, status, Tasker, fee, and available actions.
- A Tasker roster with online/availability and current assignment information.
- **Direct dispatch**, which creates a task with category, description, pickup/drop-off, notes, Tasker, and a fixed fee. It skips bidding and creates the task directly as **ASSIGNED**.
- **Delete all records**, which clears the dashboard’s current task list and local admin order data. It does not delete orders from the mobile app or WhatsApp bot; cleared IDs are hidden from later syncs.

The mobile app syncs local order changes to the admin service and polls for remote orders. A runner appears online after opening the runner feed and sending heartbeats; presence expires after 60 seconds without one. Direct dispatch is an admin-authorized assignment and does not collect or record a customer payment. The assigned task can continue through the Tasker progress and proof flow.

## 7. App areas at a glance

| Area | What it contains |
|---|---|
| **Customer → Errands** | Active-order counts, status filters, order cards, and active progress summary |
| **Customer → Post Task** | Category picker/search, route stops and location suggestions, instructions, load/time estimates, attachments |
| **Customer → Profile** | Account details, completed/cancelled history, Dual Simulator toggle, support link, logout |
| **Customer → Order detail** | Bid inbox, route and instructions, map preview, Tasker contact, payment/proof actions, cancellation |
| **Tasker → Errand Feed** | Online switch, open gigs, bid submission/edit/withdrawal, negotiation |
| **Tasker → My Errands** | Bid threads, active assignments, proof upload, status filters, completed earnings and ratings |
| **Operations dashboard** | Workload metrics, task search/filter, Tasker roster, fixed-fee direct dispatch, record clearing |

## Demo behavior and limitations

- Login accounts and data are for demonstration. The app store starts with in-memory order state; without the local admin bridge, app data is not a persistent multi-device backend. Running the local bridge persists admin-side order data.
- Authentication is a demo credential check, not production identity/security. The call actions use a hardcoded demo number rather than each order's contact details.
- UPI is a safe mock flow: the sheet simulates processing and creates a reference. It does not connect to GPay, PhonePe, Paytm, a bank, or a payment processor, and it deducts no money.
- The route map is a preview using OpenStreetMap tiles via the local admin service; the displayed ETA is illustrative. Runner presence is session/heartbeat based, not GPS tracking.
- The local dashboard has no authentication or authorization and binds to all network interfaces.
- The Profile support action currently opens a placeholder email address. Raising a proof issue is also demo-only and does not notify a real support team.
