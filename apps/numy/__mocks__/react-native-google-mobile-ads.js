/* eslint-env jest */
module.exports = {
  AdsConsent: {
    requestInfoUpdate: jest.fn(() => Promise.resolve()),
    loadAndShowConsentFormIfRequired: jest.fn(() =>
      Promise.resolve({ canRequestAds: true, status: "OBTAINED" })
    ),
  },
};
