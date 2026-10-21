import React, { useState } from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import '../src/localization/i18n';
import { OtpFields, type PendingOtp } from '../src/features/auth/OtpFields';

const challenge: PendingOtp = {
  challengeId: 'test-challenge',
  requestedAt: Date.now(),
  expiresIn: 300,
  resendAfter: 60,
};
let renderer: ReactTestRenderer.ReactTestRenderer;
let onChange: jest.Mock;

async function render(busy = false) {
  onChange = jest.fn();
  function Harness() {
    const [value, setValue] = useState('');
    return (
      <OtpFields
        challenge={challenge}
        value={value}
        onChange={code => {
          onChange(code);
          setValue(code);
        }}
        onResend={jest.fn()}
        busy={busy}
      />
    );
  }
  await act(async () => {
    renderer = ReactTestRenderer.create(<Harness />);
  });
  const inputs = renderer.root.findAllByType(TextInput);
  inputs.forEach(input => {
    input.instance.focus = jest.fn();
  });
  return inputs;
}

afterEach(async () => {
  await act(async () => renderer?.unmount());
});

test('six boxes advance focus after each digit and produce a six-digit code', async () => {
  const inputs = await render();
  expect(inputs).toHaveLength(6);
  for (let index = 0; index < 6; index++) {
    await act(async () => inputs[index].props.onChangeText(String(index + 1)));
    expect(inputs[Math.min(index + 1, 5)].instance.focus).toHaveBeenCalled();
  }
  expect(inputs.map(input => input.props.value)).toEqual([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
  ]);
  expect(onChange).toHaveBeenLastCalledWith('123456');
});

test('deleting a filled box moves back and preserves the positions of later digits', async () => {
  const inputs = await render();
  await act(async () => inputs[0].props.onChangeText('123456'));
  await act(async () => {
    inputs[2].props.onKeyPress({ nativeEvent: { key: 'Backspace' } });
    inputs[2].props.onChangeText('');
  });
  expect(inputs[1].instance.focus).toHaveBeenCalledTimes(1);
  expect(inputs.map(input => input.props.value)).toEqual([
    '1',
    '2',
    '',
    '4',
    '5',
    '6',
  ]);
  await act(async () => inputs[2].props.onChangeText('9'));
  expect(onChange).toHaveBeenLastCalledWith('129456');
});

test('backspace in an empty box clears and focuses the previous box', async () => {
  const inputs = await render();
  await act(async () => inputs[0].props.onChangeText('1'));
  await act(async () =>
    inputs[1].props.onKeyPress({ nativeEvent: { key: 'Backspace' } }),
  );
  expect(inputs[0].instance.focus).toHaveBeenCalledTimes(1);
  expect(inputs.every(input => input.props.value === '')).toBe(true);
  expect(onChange).toHaveBeenLastCalledWith('');
});

test('paste and autofill distribute digits, reject letters, and limit the code to six digits', async () => {
  const inputs = await render();
  await act(async () => inputs[0].props.onChangeText('abc'));
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => inputs[3].props.onChangeText('1234567'));
  expect(inputs.map(input => input.props.value).join('')).toBe('123456');
  expect(onChange).toHaveBeenLastCalledWith('123456');
  expect(inputs[5].instance.focus).toHaveBeenCalled();
});

test('clearing the controlled value resets all six boxes', async () => {
  const inputs = await render();
  await act(async () => inputs[0].props.onChangeText('123456'));
  await act(async () => {
    renderer.root.findByType(OtpFields).props.onChange('');
  });
  expect(
    renderer.root
      .findAllByType(TextInput)
      .every(input => input.props.value === ''),
  ).toBe(true);
});

test('verification disables editing while busy', async () => {
  const inputs = await render(true);
  expect(inputs.every(input => input.props.editable === false)).toBe(true);
  await act(async () => inputs[0].props.onChangeText('123456'));
  expect(onChange).not.toHaveBeenCalled();
});
