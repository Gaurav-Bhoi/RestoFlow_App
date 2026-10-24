import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  DeviceEventEmitter,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  type KeyboardEvent,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import '../src/localization/i18n';
import { AppInput } from '../src/components/AppInput';
import { Screen } from '../src/components/Screen';
import { SearchInput } from '../src/components/SearchInput';
import { navigationLayout } from '../src/theme/tokens';

let renderer: ReactTestRenderer.ReactTestRenderer;
let viewport: { y: number; height: number };
let field: { y: number; height: number };
let input: TextInputInstance;
let scroller: ScrollViewInstance;

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);
  // Older Android devices can resize without reporting keyboard visibility.
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
  viewport = { y: 100, height: 600 };
  field = { y: 500, height: 54 };
});

afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function render(children = <AppInput label="Name" />, hasTabs = false) {
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <Screen hasTabs={hasTabs}>{children}</Screen>,
    );
  });
  scroller = renderer.root.findByType(ScrollView).instance;
  scroller.measureInWindow = jest.fn(callback =>
    callback(0, viewport.y, 390, viewport.height),
  );
  jest.mocked(scroller.scrollTo).mockClear();
  input = renderer.root.findAllByType(TextInput)[0].instance;
  input.isFocused = jest.fn(() => true);
  input.measureInWindow = jest.fn(callback =>
    callback(0, field.y, 300, field.height),
  );
}

async function flushLayout() {
  await act(async () => jest.runOnlyPendingTimers());
}

async function focus(index = 0) {
  await act(async () =>
    renderer.root.findAllByType(TextInput)[index].props.onFocus({}),
  );
  await flushLayout();
}

async function keyboardEvent(
  name: 'keyboardDidShow' | 'keyboardDidHide' | 'keyboardDidChangeFrame',
  screenY: number,
) {
  const event: KeyboardEvent = {
    duration: 0,
    easing: 'keyboard',
    endCoordinates: { screenX: 0, screenY, width: 390, height: 300 },
  };
  await act(async () => DeviceEventEmitter.emit(name, event));
  await flushLayout();
}

test('reveals the field when the keyboard opens before the viewport resizes', async () => {
  await render();
  await focus();
  expect(scroller.scrollTo).not.toHaveBeenCalled();

  await keyboardEvent('keyboardDidShow', 400);
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({
    y: 166,
    animated: true,
  });

  // The completed resize puts a fixed footer above the keyboard as well.
  viewport.height = 220;
  field.y = 334;
  await act(async () =>
    renderer.root.findByType(ScrollView).props.onScroll({
      nativeEvent: { contentOffset: { y: 166 } },
    }),
  );
  await act(async () => renderer.root.findByType(ScrollView).props.onLayout());
  await flushLayout();
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({
    y: 246,
    animated: true,
  });
});

test('reveals a newly focused field while the keyboard is already open', async () => {
  await render(
    <>
      <AppInput label="Name" />
      <AppInput label="Password" secureTextEntry />
    </>,
  );
  field.y = 180;
  await focus();
  await keyboardEvent('keyboardDidShow', 400);
  expect(scroller.scrollTo).not.toHaveBeenCalled();

  const password = renderer.root.findAllByType(TextInput)[1].instance;
  input.isFocused = jest.fn(() => false);
  password.isFocused = jest.fn(() => true);
  password.measureInWindow = jest.fn(callback => callback(0, 500, 300, 54));
  await focus(1);
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({
    y: 166,
    animated: true,
  });
});

test.each(['onLayout', 'onContentSizeChange'])(
  'reveals the field after %s even without a keyboard visibility event',
  async event => {
    await render();
    await focus();
    viewport.height = 260;
    await act(async () => renderer.root.findByType(ScrollView).props[event]());
    await flushLayout();
    expect(scroller.scrollTo).toHaveBeenLastCalledWith({
      y: 206,
      animated: true,
    });
  },
);

test('scrolls up to reveal a field clipped by the fixed header', async () => {
  await render();
  field.y = 70;
  await act(async () =>
    renderer.root.findByType(ScrollView).props.onScroll({
      nativeEvent: { contentOffset: { y: 200 } },
    }),
  );
  await focus();
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({
    y: 158,
    animated: true,
  });
});

test('leaves an already visible field in place', async () => {
  await render();
  field.y = 180;
  await focus();
  await keyboardEvent('keyboardDidShow', 400);
  expect(scroller.scrollTo).not.toHaveBeenCalled();
});

test('keeps search fields clear of the floating tabs and handles repeated taps', async () => {
  await render(
    <SearchInput value="" onChangeText={jest.fn()} placeholder="Search menu" />,
    true,
  );
  field.y = 620;
  await focus();
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({
    y:
      620 +
      54 -
      (700 - navigationLayout.height - navigationLayout.bottomGap - 12),
    animated: true,
  });

  jest.mocked(scroller.scrollTo).mockClear();
  await act(async () =>
    renderer.root.findByType(TextInput).props.onPressIn({}),
  );
  await flushLayout();
  expect(scroller.scrollTo).toHaveBeenCalledTimes(1);
});

test('remeasures a growing multiline field and preserves its callbacks and ref', async () => {
  const ref = React.createRef<TextInputInstance>();
  const onFocus = jest.fn();
  const onPressIn = jest.fn();
  const onContentSizeChange = jest.fn();
  await render(
    <AppInput
      ref={ref}
      label="Description"
      multiline
      onFocus={onFocus}
      onPressIn={onPressIn}
      onContentSizeChange={onContentSizeChange}
    />,
  );
  field.y = 180;
  await focus();
  await keyboardEvent('keyboardDidShow', 400);
  expect(ref.current).toBe(input);
  expect(onFocus).toHaveBeenCalledTimes(1);
  const event = { nativeEvent: { contentSize: { width: 300, height: 240 } } };
  field.height = 240;
  await act(async () => {
    renderer.root.findByType(TextInput).props.onContentSizeChange(event);
    renderer.root.findByType(TextInput).props.onPressIn({});
  });
  await flushLayout();
  expect(onContentSizeChange).toHaveBeenCalledWith(event);
  expect(onPressIn).toHaveBeenCalledTimes(1);
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({ y: 32, animated: true });
});

test('ignores a native measurement that finishes after the field loses focus', async () => {
  await render();
  let finishMeasurement: Parameters<TextInputInstance['measureInWindow']>[0];
  input.measureInWindow = jest.fn(callback => {
    finishMeasurement = callback;
  });
  await focus();
  input.isFocused = jest.fn(() => false);
  finishMeasurement!(0, 900, 300, 54);
  expect(scroller.scrollTo).not.toHaveBeenCalled();
});

test('updates the visible area when the iOS keyboard changes height', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  await render();
  field.y = 250;
  await focus();
  await keyboardEvent('keyboardDidShow', 400);
  expect(scroller.scrollTo).not.toHaveBeenCalled();
  await keyboardEvent('keyboardDidChangeFrame', 300);
  expect(scroller.scrollTo).toHaveBeenLastCalledWith({ y: 16, animated: true });
});

test('clears keyboard bounds on dismissal', async () => {
  await render();
  field.y = 250;
  await focus();
  await keyboardEvent('keyboardDidShow', 400);
  await keyboardEvent('keyboardDidHide', 700);
  field.y = 500;
  await focus();
  expect(scroller.scrollTo).not.toHaveBeenCalled();
});
