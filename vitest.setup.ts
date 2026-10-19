// Unit tests run against fixed settings, whatever the shell or CI job exports. CI sets the mock Sanity and
// localhost values for the build and smoke tests; they must not leak into the URL and embed assertions here.
process.env.NEXT_PUBLIC_SITE_URL = "https://speakeasysports.com";
delete process.env.NEXT_PUBLIC_MOCK_ASSET_ORIGIN;
delete process.env.SANITY_API_HOST;
