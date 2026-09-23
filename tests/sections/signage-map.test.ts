import { describe, expect, it } from "vitest";
import { MAP_PINS, MAP_VIEWBOX, STREETS, pinFor } from "@/components/sections/home/signage-map";

const { chimatsushima, peace, eiraku, bansui } = MAP_PINS;
const span = STREETS.hirose.at - STREETS.jozenji.at;

describe("signage map geometry", () => {
  it("draws the avenues where the client placed them", () => {
    expect(STREETS.jozenji.axis).toBe("x");
    expect(STREETS.hirose.axis).toBe("x");
    expect(STREETS.jozenji.at).toBeLessThan(STREETS.hirose.at);
    expect(STREETS.kokubuncho.axis).toBe("y");
    expect(STREETS.bansui.axis).toBe("y");
    expect(STREETS.kokubuncho.at).toBeLessThan(STREETS.bansui.at);
    expect(STREETS.kokubuncho.at).toBeLessThan(MAP_VIEWBOX.height / 2);
    expect(STREETS.kokubuncho.weight).toBe("main");
  });

  it("orders the Kokubuncho pins east → west: エーラク, ピース, 千松島", () => {
    expect(eiraku.x).toBeGreaterThan(peace.x);
    expect(peace.x).toBeGreaterThan(chimatsushima.x);
  });

  it("puts 千松島 at ~1/5 of the span from 定禅寺通り and 晩翠通り right below it", () => {
    expect((chimatsushima.x - STREETS.jozenji.at) / span).toBeCloseTo(0.2, 2);
    expect(bansui.x).toBeCloseTo(chimatsushima.x, 5);
  });

  it("keeps ピース roughly midway between the avenues", () => {
    expect(Math.abs((peace.x - STREETS.jozenji.at) / span - 0.5)).toBeLessThan(0.1);
  });

  it("puts エーラク next to the 国分町通り × 広瀬通り intersection", () => {
    expect(eiraku.x).toBeLessThan(STREETS.hirose.at);
    expect(eiraku.x).toBeGreaterThanOrEqual(STREETS.hirose.at - span * 0.15);
    expect(eiraku.y).toBeLessThan(STREETS.kokubuncho.at);
    expect(STREETS.kokubuncho.at - eiraku.y).toBeLessThan(40);
  });

  it("puts the three Kokubuncho pins above 国分町通り and 晩翠通り's below 晩翠通り", () => {
    for (const pin of [eiraku, peace, chimatsushima]) expect(pin.y).toBeLessThan(STREETS.kokubuncho.at);
    expect(bansui.y).toBeGreaterThan(STREETS.bansui.at);
    expect(bansui.y).toBeLessThan(MAP_VIEWBOX.height);
  });

  it("puts ピース on the same row as 千松島 and エーラク", () => {
    expect(peace.y).toBe(chimatsushima.y);
    expect(eiraku.y).toBe(chimatsushima.y);
  });

  it("falls back to a spare spot for an unknown venue", () => {
    const p = pinFor("unknown", 0);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeGreaterThan(0);
    expect(pinFor("peace", 3)).toBe(peace);
  });
});
