const fs = require("fs");
const path = require("path");
const System = require("../runtime/System");
const runtime = require("../runtime");
const interpret = require("./interpreter");

const VERSIONS = {
  WINAMP_3_ALPHA: "v1.1.0.a9 (Winamp 3 alpha 8r)",
  WINAMP_3_BETA: "v1.1.1.b3 (Winamp 3.0 build 488d)",
  WINAMP_3_FULL: "v1.1.1.b3 (Winamp 3.0 full)",
  WINAMP_5_02: "v1.1.13 (Winamp 5.02)",
  WINAMP_5_66: "v1.2.0 (Winamp 5.66)",
};

async function runFile(relativePath) {
  const system = new System();
  const data = fs.readFileSync(path.join(__dirname, relativePath));
  await interpret({ runtime, data, system, log: false });
}

let mockMessageBox;
beforeEach(() => {
  mockMessageBox = jest.fn();
  // The VM depends upon the arity of this function, so we can't use
  // `mockMessageBox` directly.
  System.prototype.messageBox = function(a, b, c, d) {
    mockMessageBox(...arguments);
  };
});

describe("can call messageBox with hello World", () => {
  const versions = [
    // VERSIONS.WINAMP_3_ALPHA,
    VERSIONS.WINAMP_3_BETA,
    VERSIONS.WINAMP_3_FULL,
    VERSIONS.WINAMP_5_02,
    VERSIONS.WINAMP_5_66,
  ];
  versions.forEach(version => {
    test(`with bytecode compiled by ${version}`, () => {
      runFile(`./reference/maki_compiler/${version}/hello_world.maki`);
      expect(mockMessageBox).toHaveBeenCalledTimes(1);
      expect(mockMessageBox).toHaveBeenCalledWith(
        "Hello World",
        "Hello Title",
        1,
        null
      );
    });
  });
});

describe("can use basic operators", () => {
  const versions = [
    // jberg could not get the script to compile on this version
    // VERSIONS.WINAMP_3_ALPHA,
    VERSIONS.WINAMP_3_BETA,
    VERSIONS.WINAMP_3_FULL,
    VERSIONS.WINAMP_5_02,
    VERSIONS.WINAMP_5_66,
  ];

  // The basicTest.m file that jberg prepared follows a convention for what a
  // passing test looks like. This ultility function lets us just write the
  // message, since the rest is common for all success messages.
  function successOutputFromMessage(message) {
    return [message, "Success", 0, ""];
  }

  versions.forEach(version => {
    test(`with basic test bytecode compiled by ${version}`, async () => {
      try {
        await runFile(`./reference/maki_compiler/${version}/basicTests.maki`);
      } catch (e) {
        // Uncomment this next line to find the next bug to work on.
        console.error(e);
      }
      expect(mockMessageBox.mock.calls).toEqual(
        [
          "2 + 2 = 4",
          "2.2 + 2.2 = 4.4",
          "4 + 4.4 = 4.4 + 4 (not implict casting)",
          "#t + #t = 2",
          "3 - 2 = 1",
          "3 - -2 = 5",
          "3.5 - 2 = 1.5",
          "2 * 3 = 6",
          "2 * 1.5 = 3",
          "#t * 3 = 3",
          "#f * 3 = 0",
          "#t * 0.25 = 0.25",
          "0.25 * #t = 0.25",
          "#f * 0.25 = 0",
          "6 / 3 = 2",
          "3 / 2 = 1.5",
          "5 % 2 = 1",
          "5.5 % 2 = 1 (implict casting)",
          "3 & 2 = 2",
          "3 | 2 = 3",
          "2 << 1 = 4",
          "4 >> 1 = 2",
          "2.5 << 1 = 4 (implict casting)",
          "4.5 >> 1 = 2 (implict casting)",
          "1 != 2",
          "1 < 2",
          "2 > 1",
          "[int] 4 = [float] 4.4 (autocasting types)",
          "! [float] 4.4 = [int] 4 (not autocasting types)",
          "[float] 4.4 != [int] 4 (not autocasting types)",
          "! [int] 4 != [float] 4.4 (autocasting types)",
          "[int] 4 <= [float] 4.4 (autocasting types)",
          "[int] 4 >= [float] 4.4 (autocasting types)",
          "! [float] 4.4 <= [int] 4 (not autocasting types)",
          "[float] 4.4 >= [int] 4 (not autocasting types)",
          "! [int] 4 < [float] 4.4 (autocasting types)",
          "! [float] 4.4 < [int] 4 (not autocasting types)",
          "! [int] 4 > [float] 4.4 (autocasting types)",
          "[float] 4.4 > [int] 4 (not autocasting types)",
          "1++ = 1",
          "1++ (after incremeent) = 2",
          "2-- = 2",
          "2-- (after decrement) = 1",
          "++1 = 2",
          "!#f",
          "!0",
          "!1 == #f",
          "1 == #t",
          "0 == #f",
          "#t && #t",
          "!(#t && #f)",
          "!(#f && #f)",
          "#t || #t",
          "#t || #f",
          "#f || #t",
          "!(#f || #f)",
          "#t || ++n (doesn't short circuit)",
          "!(#f && ++ n) (doesn't short circuit)",
        ].map(successOutputFromMessage)
      );
    });

    test(`with simple functions test bytecode compiled by ${version}`, async () => {
      try {
        await runFile(
          `./reference/maki_compiler/${version}/simpleFunctions.maki`
        );
      } catch (e) {
        // Uncomment this next line to find the next bug to work on.
        console.error(e);
      }
      expect(mockMessageBox.mock.calls).toEqual(
        [
          "simple custom function",
          "simple custom function with implicit cast",
        ].map(successOutputFromMessage)
      );
    });
  });
});
