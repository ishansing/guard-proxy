import { evaluatePolicy } from "./src/policies/engine";
const res = evaluatePolicy([], ["CREDIT_CARD"], "request", "4111222233334444");
console.log(res);
