import { describe, expect, it } from "vitest";
import { parseFilter, parsePage } from "./paginate";

describe("parsePage", () => {
  it("accepts 1 to 9999 and defaults to 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "5"])).toBe(2);
    for (const bad of ["0", "-1", "01", "abc", "10000", ""]) expect(parsePage(bad)).toBeNull();
  });
});

describe("parseFilter", () => {
  it("maps the all sentinel to no school and rejects bad segments", () => {
    expect(parseFilter("all", "2")).toEqual({ school: "", page: 2 });
    expect(parseFilter("georgia", "1")).toEqual({ school: "georgia", page: 1 });
    expect(parseFilter("Georgia", "1")).toBeNull();
    expect(parseFilter("georgia", "0")).toBeNull();
  });
});
