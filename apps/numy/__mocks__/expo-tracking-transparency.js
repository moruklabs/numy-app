/* eslint-env jest */
module.exports = {
  getTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestTrackingPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
    UNDETERMINED: "undetermined",
    RESTRICTED: "restricted",
  },
};
