export const runtime = "nodejs";

// navigator.sendBeacon on tab close posts here; it does exactly what a normal logout does.
export { POST } from "../logout/route";
