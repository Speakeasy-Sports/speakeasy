import { describe, expect, it } from "vitest";
import {
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_LEGAL_LINKS,
  DEFAULT_MENU_LINKS,
  isExternalHref,
  isValidHref,
  resolveFooterColumns,
  resolveLinks,
} from "./nav-links";

describe("isValidHref", () => {
  it("accepts site paths, https URLs, and mailto", () => {
    expect(isValidHref("/newsletter")).toBe(true);
    expect(isValidHref("/feed.xml")).toBe(true);
    expect(isValidHref("https://club.speakeasysports.com")).toBe(true);
    expect(isValidHref("mailto:hello@speakeasysports.com")).toBe(true);
  });

  it("rejects protocol-relative, http, javascript, and bare text", () => {
    expect(isValidHref("//evil.example")).toBe(false);
    expect(isValidHref("http://speakeasysports.com")).toBe(false);
    expect(isValidHref("javascript:alert(1)")).toBe(false);
    expect(isValidHref("newsletter")).toBe(false);
  });

  it("treats only site paths as internal", () => {
    expect(isExternalHref("/about")).toBe(false);
    expect(isExternalHref("https://x.com/speakeasy")).toBe(true);
  });
});

describe("resolveLinks", () => {
  it("falls back to the defaults when empty or unset", () => {
    expect(resolveLinks(null, DEFAULT_MENU_LINKS)).toEqual(DEFAULT_MENU_LINKS);
    expect(resolveLinks([], DEFAULT_LEGAL_LINKS)).toEqual(DEFAULT_LEGAL_LINKS);
  });

  it("keeps valid links in order and drops broken ones", () => {
    const links = resolveLinks(
      [
        { label: " Shop ", href: " https://shop.example.com " },
        { label: "", href: "/about" },
        { label: "Bad", href: "javascript:alert(1)" },
        null,
        { label: "About", href: "/about" },
      ],
      DEFAULT_MENU_LINKS,
    );
    expect(links).toEqual([
      { label: "Shop", href: "https://shop.example.com" },
      { label: "About", href: "/about" },
    ]);
  });

  it("falls back when every link is broken", () => {
    expect(resolveLinks([{ label: "Bad", href: "nope" }], DEFAULT_LEGAL_LINKS)).toEqual(DEFAULT_LEGAL_LINKS);
  });
});

describe("resolveFooterColumns", () => {
  it("defaults to the Speakeasy column", () => {
    expect(resolveFooterColumns(undefined)).toEqual(DEFAULT_FOOTER_COLUMNS);
  });

  it("drops columns without a title or any valid link", () => {
    const columns = resolveFooterColumns([
      { title: "Company", links: [{ label: "About", href: "/about" }] },
      { title: "", links: [{ label: "Contact", href: "/contact" }] },
      { title: "Empty", links: [{ label: "Bad", href: "bad" }] },
    ]);
    expect(columns).toEqual([{ title: "Company", links: [{ label: "About", href: "/about" }] }]);
  });
});
