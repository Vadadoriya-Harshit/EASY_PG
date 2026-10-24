export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logServerStartup } = await import("./lib/server-logger");
    await logServerStartup();
  }
}
