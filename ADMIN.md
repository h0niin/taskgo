# TaskGo local operations dashboard

The admin dashboard is served locally by the same small Node service that receives Expo Go order/status sync. It can also read orders from the WhatsApp bot bridge on port 3001 when that bridge is running.

## Start it

From the project root, run `npm run admin` in its own terminal. Open `http://localhost:3002` on the laptop. Keep this terminal running while using Expo Go. Start Metro separately with `npm start`.

The admin service prints a LAN URL at startup. The phone running Expo Go and the laptop must be on the same Wi-Fi/LAN. The app derives the laptop host from the Expo SDK host URI and connects to port 3002. To override this, set `EXPO_PUBLIC_TASKGO_ADMIN_URL` to `http://<laptop-lan-ip>:3002` before starting Metro.

The WhatsApp bot may continue running on port 3001. The dashboard reads its `/api/orders` endpoint; dashboard-created fixed-fee tasks are persisted by the admin service and are returned to Expo Go. Local orders created or advanced in the app are synced back to the dashboard.

## Fixed-price direct dispatch

Use **Direct dispatch** to create a task, choose a taskboy and enter the agreed fixed fee. It skips bidding and creates the task directly as `ASSIGNED`, so it appears in the selected runner's **My Errands** and can proceed through the normal progress/proof flow. This is an admin-authorized dispatch; it does not collect or record a customer payment.

Taskboy availability is heartbeat-based. A runner appears online after opening the runner feed in Expo Go and goes offline after 60 seconds without a heartbeat. Current work is derived from assigned, non-terminal orders. Busy/offline assignment requires an explicit confirmation in the dashboard.

## Local-only limitations

This is a development/local-network tool, not a production admin system. It has no authentication or authorization, and it stores its local task data in `.taskgo-admin-orders.json`. Do not expose port 3002 to the public internet or use real customer data. Runner presence is session-based, not GPS tracking. The service binds to all network interfaces so a phone on the same LAN can reach it.
