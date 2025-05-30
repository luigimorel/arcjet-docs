import { env } from "$env/dynamic/private";
import arcjet, { sensitiveInfo } from "@arcjet/sveltekit";
import { error } from "@sveltejs/kit";

const aj = arcjet({
  key: env.ARCJET_KEY, // Get your site key from https://app.arcjet.com
  rules: [
    // This allows all sensitive entities other than email addresses
    sensitiveInfo({
      mode: "LIVE", // Will block requests, use "DRY_RUN" to log only
      // allow: ["EMAIL"], Will block all sensitive information types other than email.
      deny: ["EMAIL"], // Will block email addresses
    }),
  ],
});

export async function handle({ event, resolve }) {
  const decision = await aj.protect(event);
  console.log("Arcjet decision", decision);

  if (decision.isDenied()) {
    return error(400, "Bad request - sensitive information detected");
  }

  return resolve(event);
}
