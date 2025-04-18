import arcjet, { validateEmail } from "@arcjet/node";
import express from "express";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }));

const aj = arcjet({
  // Get your site key from https://app.arcjet.com and set it as an environment
  // variable rather than hard coding.
  key: process.env.ARCJET_KEY,
  rules: [
    validateEmail({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      deny: ["NO_MX_RECORDS"], // block email addresses with no MX records
    }),
  ],
});

app.post("/", async (req, res) => {
  console.log("Email received: ", req.body.email);

  const decision = await aj.protect(req, {
    email: req.body.email,
  });
  console.log("Arcjet decision", decision);

  for (const { reason } of decision.results) {
    if (reason.isError()) {
      // Fail open by logging the error and continuing
      console.warn("Arcjet error", reason.message);
      // You could also fail closed here for very sensitive routes
      //res.writeHead(503, { "Content-Type": "application/json" });
      //res.end(JSON.stringify({ error: "Service unavailable" }));
    }
  }

  if (decision.isDenied()) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Forbidden" }));
  } else {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello World", email: req.body.email }));
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
