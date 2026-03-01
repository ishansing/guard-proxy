import { expect, test, describe } from "bun:test";
import { app } from "./index";

describe("DLP Redaction Integration", () => {
  test("Redacts EMAIL from POST request body", async () => {
    // We'll proxy to httpbin.org/post which returns the posted data back
    const res = await app.request("https://httpbin.org/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Contact me at secret@example.com",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    
    // httpbin returns the sent data in the 'json' or 'data' field
    // Our proxy should have redacted it BEFORE sending to httpbin
    // OR httpbin returns it and we redact it on the way back.
    // In our middleware, we redact BOTH directions.
    
    expect(JSON.stringify(body)).toContain("[REDACTED:EMAIL]");
    expect(JSON.stringify(body)).not.toContain("secret@example.com");
  });

  test("Redacts CREDIT_CARD from response", async () => {
    // httpbin.org/base64/encoded_string returns the decoded string
    // We can use this to simulate a server returning a credit card
    const cc = "4111 2222 3333 4444";
    const encoded = Buffer.from(cc).toString("base64");
    
    const res = await app.request(`https://httpbin.org/base64/${encoded}`);
    
    expect(res.status).toBe(200);
    const text = await res.text();
    
    expect(text).toContain("[REDACTED:CREDIT_CARD]");
    expect(text).not.toContain("4111");
  });

  test("Redacts Passwords only in request (direction: request)", async () => {
    const res = await app.request("https://httpbin.org/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "my-super-secret" }),
    });

    const body = await res.json();
    // The PASSWORD_FIELD pattern is specifically for "password": "..."
    expect(JSON.stringify(body)).toContain("[REDACTED:PASSWORD_FIELD]");
  });
});
