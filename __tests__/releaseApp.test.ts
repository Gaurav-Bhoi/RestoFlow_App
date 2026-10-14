const mockWithStallion = jest.fn();
const mockLoadStallion = jest.fn();
jest.mock('react-native-stallion', () => {
  mockLoadStallion();
  return { withStallion: mockWithStallion };
});

test.each([
  [false, true, false],
  [false, false, true],
  [true, false, false],
])('debug=%s mock=%s initializes OTA=%s', (debug, mock, expectedOta) => {
  const originalDebug = __DEV__;
  const wrapped = () => null;
  const wrap = mockWithStallion;
  wrap.mockClear().mockReturnValue(wrapped);
  mockLoadStallion.mockClear();
  jest.doMock('../src/config/env', () => ({ ENV: { MOCK_API: mock } }));
  try {
    Object.assign(globalThis, { __DEV__: debug });
    jest.isolateModules(() => {
      const App = require('../App').default;
      if (expectedOta) {
        expect(mockLoadStallion).toHaveBeenCalledTimes(1);
        expect(wrap).toHaveBeenCalledTimes(1);
        expect(App).toBe(wrapped);
      } else {
        expect(mockLoadStallion).not.toHaveBeenCalled();
        expect(wrap).not.toHaveBeenCalled();
        expect(typeof App).toBe('function');
      }
    });
  } finally {
    Object.assign(globalThis, { __DEV__: originalDebug });
    jest.dontMock('../src/config/env');
  }
});
