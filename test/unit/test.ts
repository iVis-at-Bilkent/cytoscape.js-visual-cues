const assert = require("assert");
// import { getClassStr } from "../../src/utils2";

function test(found: string, expected: string): void {
  try {
    assert.equal(found, expected);
    console.log(`\u001B[32m✓\u001B[39m ${expected}`);
  } catch (e) {
    console.log(`Error! Expected '${expected}', but found '${found}'`);
  }
}

function testGetClassStr() {
  // const r1 = getClassStr(["a", "b", "c"]);
  // test(r1, "a b c");
}

test("11", "11");
test("11", "12");
testGetClassStr();
