declare const browser: any;

console.log("CSES Companion background loaded!");

browser.runtime.onMessage.addListener((message: any) => {
  console.log("Message received from content script:", message);

  if (message.type === "PROBLEM_DETECTED") {
    console.log("Detected CSES problem:", message.problem);
  }
});
