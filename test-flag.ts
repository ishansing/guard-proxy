import { evaluatePolicy } from "./src/policies/engine";
import { runHybridScan } from "./src/middleware/dlp";

async function test() {
  const result = await runHybridScan("my cc is 4111222233334444", "/test", "request");
  console.log("REQUEST:", result);
  
  const resHTML = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">
<title>404 Not Found</title>
<h1>Not Found</h1>
<p>The requested URL was not found on the server.  If you entered the URL manually please check your spelling and try again.</p>`;
  const result2 = await runHybridScan(resHTML, "/test", "response");
  console.log("RESPONSE:", result2);
}
test();
