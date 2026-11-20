import { describe, expect, it } from "vitest";
import { TestDriver } from "testdriverai/vitest/hooks";

describe("Speakeasy Sports Production", () => {
  it("loads the home page and allows navigating to Community and Newsletter", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: "https://speakeasysports.com" });

    const homeAssert = await testdriver.assert("The Speakeasy Sports homepage is loaded with header and navigation links");
    expect(homeAssert).toBeTruthy();

    await testdriver.find("Community navigation link").click();

    const communityAssert = await testdriver.assert("The Community page is displayed with the community heading");
    expect(communityAssert).toBeTruthy();

    await testdriver.find("Newsletter button in the header").click();

    const newsletterAssert = await testdriver.assert("The Newsletter page is displayed with an email address input and Sign up button");
    expect(newsletterAssert).toBeTruthy();
  });

  it("navigates to National coverage and opens an article", async (context) => {
    const testdriver = TestDriver(context);

    await testdriver.provision.chrome({ url: "https://speakeasysports.com" });

    await testdriver.find("NATIONAL link").click();

    const nationalAssert = await testdriver.assert("The National sports section is displayed with articles");
    expect(nationalAssert).toBeTruthy();

    await testdriver.find("How we will cover recruiting, and what we will not do article link").click();

    const articleAssert = await testdriver.assert("The article page is displayed with headline, byline, and article content");
    expect(articleAssert).toBeTruthy();
  });
});
