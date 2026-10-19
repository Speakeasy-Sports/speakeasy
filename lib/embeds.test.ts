import { describe, expect, it } from "vitest";
import { podcastEmbedHeight, podcastEmbedUrl, youtubeEmbedUrl, youtubeId, youtubeThumbnail } from "./embeds";

describe("youtubeId", () => {
  it("reads watch, short, shorts, embed, and live URLs", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://m.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects other hosts and malformed ids", () => {
    expect(youtubeId("https://vimeo.com/123")).toBeNull();
    expect(youtubeId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(youtubeId("not a url")).toBeNull();
    expect(youtubeId("https://evil.com/?v=dQw4w9WgXcQ")).toBeNull();
  });
  it("builds privacy-enhanced embed and thumbnail URLs", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    expect(youtubeThumbnail("dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });
});

describe("podcastEmbedUrl", () => {
  it("converts Spotify episode and show URLs", () => {
    expect(podcastEmbedUrl("spotify", "https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk?si=x")).toBe(
      "https://open.spotify.com/embed/episode/4rOoJ6Egrf8K2IrywzwOMk?theme=0",
    );
    expect(podcastEmbedUrl("spotify", "https://open.spotify.com/intl-de/show/abc123")).toBe(
      "https://open.spotify.com/embed/show/abc123?theme=0",
    );
    expect(podcastEmbedUrl("spotify", "https://example.com/episode/abc")).toBeNull();
  });
  it("converts Apple Podcasts URLs to the embed host", () => {
    expect(podcastEmbedUrl("apple", "https://podcasts.apple.com/us/podcast/x/id123?i=456")).toBe(
      "https://embed.podcasts.apple.com/us/podcast/x/id123?i=456",
    );
    expect(podcastEmbedUrl("apple", "https://open.spotify.com/episode/x")).toBeNull();
  });
  it("passes through other https players and rejects http", () => {
    expect(podcastEmbedUrl("other", "https://player.example.com/e/123")).toBe("https://player.example.com/e/123");
    expect(podcastEmbedUrl("other", "http://player.example.com/e/123")).toBeNull();
  });
  it("knows player heights", () => {
    expect(podcastEmbedHeight("spotify")).toBe(152);
    expect(podcastEmbedHeight("apple")).toBe(175);
  });
});
