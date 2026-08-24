/* ==========================================================================
   KeyLab - Keyboard Layout Engine, Event Listener & Diagnostics
   Real ANSI Layouts: 100% Full-Size, TKL (87-key), 75%, 65%, 60%
   NKRO Tracking, Millisecond Latency & Heatmap Frequency
   ========================================================================== */

const KEYBOARD_LAYOUTS = {
  // --------------------------------------------------------------------------
  // 1. FULL-SIZE 100% (104 Keys - Standard ANSI with Nav 6-Pack & Numpad)
  // --------------------------------------------------------------------------
  ansi_100: [
    // Row 1: Function Row + Spacers + Nav Print/Scroll/Pause
    [
      { code: 'Escape', label: 'ESC', cls: 'accent-esc k-1' },
      { spacer: true, w: 1 },
      { code: 'F1', label: 'F1', cls: 'mod k-1' },
      { code: 'F2', label: 'F2', cls: 'mod k-1' },
      { code: 'F3', label: 'F3', cls: 'mod k-1' },
      { code: 'F4', label: 'F4', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'F5', label: 'F5', cls: 'mod k-1' },
      { code: 'F6', label: 'F6', cls: 'mod k-1' },
      { code: 'F7', label: 'F7', cls: 'mod k-1' },
      { code: 'F8', label: 'F8', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'F9', label: 'F9', cls: 'mod k-1' },
      { code: 'F10', label: 'F10', cls: 'mod k-1' },
      { code: 'F11', label: 'F11', cls: 'mod k-1' },
      { code: 'F12', label: 'F12', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'PrintScreen', label: 'PRT', cls: 'mod k-1' },
      { code: 'ScrollLock', label: 'SCR', cls: 'mod k-1' },
      { code: 'Pause', label: 'PAU', cls: 'mod k-1' }
    ],
    // Row 2: Numbers + Backspace + Insert/Home/PgUp + Numpad Top
    [
      { code: 'Backquote', label: '~', sub: '`', cls: 'k-1' },
      { code: 'Digit1', label: '!', sub: '1', cls: 'k-1' },
      { code: 'Digit2', label: '@', sub: '2', cls: 'k-1' },
      { code: 'Digit3', label: '#', sub: '3', cls: 'k-1' },
      { code: 'Digit4', label: '$', sub: '4', cls: 'k-1' },
      { code: 'Digit5', label: '%', sub: '5', cls: 'k-1' },
      { code: 'Digit6', label: '^', sub: '6', cls: 'k-1' },
      { code: 'Digit7', label: '&', sub: '7', cls: 'k-1' },
      { code: 'Digit8', label: '*', sub: '8', cls: 'k-1' },
      { code: 'Digit9', label: '(', sub: '9', cls: 'k-1' },
      { code: 'Digit0', label: ')', sub: '0', cls: 'k-1' },
      { code: 'Minus', label: '_', sub: '-', cls: 'k-1' },
      { code: 'Equal', label: '+', sub: '=', cls: 'k-1' },
      { code: 'Backspace', label: 'BKSP', cls: 'mod k-2' },
      { spacer: true, w: 0.5 },
      { code: 'Insert', label: 'INS', cls: 'mod k-1' },
      { code: 'Home', label: 'HOME', cls: 'mod k-1' },
      { code: 'PageUp', label: 'PGUP', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'NumLock', label: 'NUM', cls: 'mod k-1' },
      { code: 'NumpadDivide', label: '/', cls: 'mod k-1' },
      { code: 'NumpadMultiply', label: '*', cls: 'mod k-1' },
      { code: 'NumpadSubtract', label: '-', cls: 'mod k-1' }
    ],
    // Row 3: Tab + QWERTY + Delete/End/PgDn + Numpad 789+
    [
      { code: 'Tab', label: 'TAB', cls: 'mod k-15' },
      { code: 'KeyQ', label: 'Q', cls: 'k-1' },
      { code: 'KeyW', label: 'W', cls: 'k-1' },
      { code: 'KeyE', label: 'E', cls: 'k-1' },
      { code: 'KeyR', label: 'R', cls: 'k-1' },
      { code: 'KeyT', label: 'T', cls: 'k-1' },
      { code: 'KeyY', label: 'Y', cls: 'k-1' },
      { code: 'KeyU', label: 'U', cls: 'k-1' },
      { code: 'KeyI', label: 'I', cls: 'k-1' },
      { code: 'KeyO', label: 'O', cls: 'k-1' },
      { code: 'KeyP', label: 'P', cls: 'k-1' },
      { code: 'BracketLeft', label: '{', sub: '[', cls: 'k-1' },
      { code: 'BracketRight', label: '}', sub: ']', cls: 'k-1' },
      { code: 'Backslash', label: '|', sub: '\\', cls: 'mod k-15' },
      { spacer: true, w: 0.5 },
      { code: 'Delete', label: 'DEL', cls: 'mod k-1' },
      { code: 'End', label: 'END', cls: 'mod k-1' },
      { code: 'PageDown', label: 'PGDN', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'Numpad7', label: '7', cls: 'k-1' },
      { code: 'Numpad8', label: '8', cls: 'k-1' },
      { code: 'Numpad9', label: '9', cls: 'k-1' },
      { code: 'NumpadAdd', label: '+', cls: 'mod k-1' }
    ],
    // Row 4: CapsLock + ASDF + Enter + Numpad 456
    [
      { code: 'CapsLock', label: 'CAPS', cls: 'mod k-175' },
      { code: 'KeyA', label: 'A', cls: 'k-1' },
      { code: 'KeyS', label: 'S', cls: 'k-1' },
      { code: 'KeyD', label: 'D', cls: 'k-1' },
      { code: 'KeyF', label: 'F', cls: 'k-1' },
      { code: 'KeyG', label: 'G', cls: 'k-1' },
      { code: 'KeyH', label: 'H', cls: 'k-1' },
      { code: 'KeyJ', label: 'J', cls: 'k-1' },
      { code: 'KeyK', label: 'K', cls: 'k-1' },
      { code: 'KeyL', label: 'L', cls: 'k-1' },
      { code: 'Semicolon', label: ':', sub: ';', cls: 'k-1' },
      { code: 'Quote', label: '"', sub: '\'', cls: 'k-1' },
      { code: 'Enter', label: 'ENTER', cls: 'accent-enter k-225' },
      { spacer: true, w: 4 },
      { code: 'Numpad4', label: '4', cls: 'k-1' },
      { code: 'Numpad5', label: '5', cls: 'k-1' },
      { code: 'Numpad6', label: '6', cls: 'k-1' },
      { spacer: true, w: 1 }
    ],
    // Row 5: LShift + ZXCV + RShift + ArrowUp + Numpad 123 + Enter
    [
      { code: 'ShiftLeft', label: 'SHIFT', cls: 'mod k-225' },
      { code: 'KeyZ', label: 'Z', cls: 'k-1' },
      { code: 'KeyX', label: 'X', cls: 'k-1' },
      { code: 'KeyC', label: 'C', cls: 'k-1' },
      { code: 'KeyV', label: 'V', cls: 'k-1' },
      { code: 'KeyB', label: 'B', cls: 'k-1' },
      { code: 'KeyN', label: 'N', cls: 'k-1' },
      { code: 'KeyM', label: 'M', cls: 'k-1' },
      { code: 'Comma', label: '<', sub: ',', cls: 'k-1' },
      { code: 'Period', label: '>', sub: '.', cls: 'k-1' },
      { code: 'Slash', label: '?', sub: '/', cls: 'k-1' },
      { code: 'ShiftRight', label: 'SHIFT', cls: 'mod k-275' },
      { spacer: true, w: 1.5 },
      { code: 'ArrowUp', label: '▲', cls: 'mod k-1' },
      { spacer: true, w: 1.5 },
      { code: 'Numpad1', label: '1', cls: 'k-1' },
      { code: 'Numpad2', label: '2', cls: 'k-1' },
      { code: 'Numpad3', label: '3', cls: 'k-1' },
      { code: 'NumpadEnter', label: 'ENT', cls: 'accent-enter k-1' }
    ],
    // Row 6: Bottom Modifiers + Space + Arrows + Numpad 0 .
    [
      { code: 'ControlLeft', label: 'CTRL', cls: 'mod k-125' },
      { code: 'MetaLeft', label: 'WIN', cls: 'mod k-125' },
      { code: 'AltLeft', label: 'ALT', cls: 'mod k-125' },
      { code: 'Space', label: 'SPACE', cls: 'k-625' },
      { code: 'AltRight', label: 'ALT', cls: 'mod k-125' },
      { code: 'MetaRight', label: 'WIN', cls: 'mod k-125' },
      { code: 'ContextMenu', label: 'MENU', cls: 'mod k-125' },
      { code: 'ControlRight', label: 'CTRL', cls: 'mod k-125' },
      { spacer: true, w: 0.5 },
      { code: 'ArrowLeft', label: '◀', cls: 'mod k-1' },
      { code: 'ArrowDown', label: '▼', cls: 'mod k-1' },
      { code: 'ArrowRight', label: '▶', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'Numpad0', label: '0', cls: 'k-2' },
      { code: 'NumpadDecimal', label: '.', cls: 'mod k-1' },
      { spacer: true, w: 1 }
    ]
  ],

  // --------------------------------------------------------------------------
  // 2. TENKEYLESS TKL 80% (87 Keys - Standard ANSI Mechanical Keyboard)
  // --------------------------------------------------------------------------
  ansi_tkl: [
    // Row 1: Function Row + Spacers + PrtSc/ScrLk/Pause
    [
      { code: 'Escape', label: 'ESC', cls: 'accent-esc k-1' },
      { spacer: true, w: 1 },
      { code: 'F1', label: 'F1', cls: 'mod k-1' },
      { code: 'F2', label: 'F2', cls: 'mod k-1' },
      { code: 'F3', label: 'F3', cls: 'mod k-1' },
      { code: 'F4', label: 'F4', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'F5', label: 'F5', cls: 'mod k-1' },
      { code: 'F6', label: 'F6', cls: 'mod k-1' },
      { code: 'F7', label: 'F7', cls: 'mod k-1' },
      { code: 'F8', label: 'F8', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'F9', label: 'F9', cls: 'mod k-1' },
      { code: 'F10', label: 'F10', cls: 'mod k-1' },
      { code: 'F11', label: 'F11', cls: 'mod k-1' },
      { code: 'F12', label: 'F12', cls: 'mod k-1' },
      { spacer: true, w: 0.5 },
      { code: 'PrintScreen', label: 'PRT', cls: 'mod k-1' },
      { code: 'ScrollLock', label: 'SCR', cls: 'mod k-1' },
      { code: 'Pause', label: 'PAU', cls: 'mod k-1' }
    ],
    // Row 2: Numbers + Backspace + Ins/Home/PgUp
    [
      { code: 'Backquote', label: '~', sub: '`', cls: 'k-1' },
      { code: 'Digit1', label: '!', sub: '1', cls: 'k-1' },
      { code: 'Digit2', label: '@', sub: '2', cls: 'k-1' },
      { code: 'Digit3', label: '#', sub: '3', cls: 'k-1' },
      { code: 'Digit4', label: '$', sub: '4', cls: 'k-1' },
      { code: 'Digit5', label: '%', sub: '5', cls: 'k-1' },
      { code: 'Digit6', label: '^', sub: '6', cls: 'k-1' },
      { code: 'Digit7', label: '&', sub: '7', cls: 'k-1' },
      { code: 'Digit8', label: '*', sub: '8', cls: 'k-1' },
      { code: 'Digit9', label: '(', sub: '9', cls: 'k-1' },
      { code: 'Digit0', label: ')', sub: '0', cls: 'k-1' },
      { code: 'Minus', label: '_', sub: '-', cls: 'k-1' },
      { code: 'Equal', label: '+', sub: '=', cls: 'k-1' },
      { code: 'Backspace', label: 'BKSP', cls: 'mod k-2' },
      { spacer: true, w: 0.5 },
      { code: 'Insert', label: 'INS', cls: 'mod k-1' },
      { code: 'Home', label: 'HOME', cls: 'mod k-1' },
      { code: 'PageUp', label: 'PGUP', cls: 'mod k-1' }
    ],
    // Row 3: Tab + QWERTY + Del/End/PgDn
    [
      { code: 'Tab', label: 'TAB', cls: 'mod k-15' },
      { code: 'KeyQ', label: 'Q', cls: 'k-1' },
      { code: 'KeyW', label: 'W', cls: 'k-1' },
      { code: 'KeyE', label: 'E', cls: 'k-1' },
      { code: 'KeyR', label: 'R', cls: 'k-1' },
      { code: 'KeyT', label: 'T', cls: 'k-1' },
      { code: 'KeyY', label: 'Y', cls: 'k-1' },
      { code: 'KeyU', label: 'U', cls: 'k-1' },
      { code: 'KeyI', label: 'I', cls: 'k-1' },
      { code: 'KeyO', label: 'O', cls: 'k-1' },
      { code: 'KeyP', label: 'P', cls: 'k-1' },
      { code: 'BracketLeft', label: '{', sub: '[', cls: 'k-1' },
      { code: 'BracketRight', label: '}', sub: ']', cls: 'k-1' },
      { code: 'Backslash', label: '|', sub: '\\', cls: 'mod k-15' },
      { spacer: true, w: 0.5 },
      { code: 'Delete', label: 'DEL', cls: 'mod k-1' },
      { code: 'End', label: 'END', cls: 'mod k-1' },
      { code: 'PageDown', label: 'PGDN', cls: 'mod k-1' }
    ],
    // Row 4: CapsLock + ASDF + Enter
    [
      { code: 'CapsLock', label: 'CAPS', cls: 'mod k-175' },
      { code: 'KeyA', label: 'A', cls: 'k-1' },
      { code: 'KeyS', label: 'S', cls: 'k-1' },
      { code: 'KeyD', label: 'D', cls: 'k-1' },
      { code: 'KeyF', label: 'F', cls: 'k-1' },
      { code: 'KeyG', label: 'G', cls: 'k-1' },
      { code: 'KeyH', label: 'H', cls: 'k-1' },
      { code: 'KeyJ', label: 'J', cls: 'k-1' },
      { code: 'KeyK', label: 'K', cls: 'k-1' },
      { code: 'KeyL', label: 'L', cls: 'k-1' },
      { code: 'Semicolon', label: ':', sub: ';', cls: 'k-1' },
      { code: 'Quote', label: '"', sub: '\'', cls: 'k-1' },
      { code: 'Enter', label: 'ENTER', cls: 'accent-enter k-225' }
    ],
    // Row 5: LShift + ZXCV + RShift + ArrowUp
    [
      { code: 'ShiftLeft', label: 'SHIFT', cls: 'mod k-225' },
      { code: 'KeyZ', label: 'Z', cls: 'k-1' },
      { code: 'KeyX', label: 'X', cls: 'k-1' },
      { code: 'KeyC', label: 'C', cls: 'k-1' },
      { code: 'KeyV', label: 'V', cls: 'k-1' },
      { code: 'KeyB', label: 'B', cls: 'k-1' },
      { code: 'KeyN', label: 'N', cls: 'k-1' },
      { code: 'KeyM', label: 'M', cls: 'k-1' },
      { code: 'Comma', label: '<', sub: ',', cls: 'k-1' },
      { code: 'Period', label: '>', sub: '.', cls: 'k-1' },
      { code: 'Slash', label: '?', sub: '/', cls: 'k-1' },
      { code: 'ShiftRight', label: 'SHIFT', cls: 'mod k-275' },
      { spacer: true, w: 1.5 },
      { code: 'ArrowUp', label: '▲', cls: 'mod k-1' }
    ],
    // Row 6: Bottom Modifiers + Space + Arrows
    [
      { code: 'ControlLeft', label: 'CTRL', cls: 'mod k-125' },
      { code: 'MetaLeft', label: 'WIN', cls: 'mod k-125' },
      { code: 'AltLeft', label: 'ALT', cls: 'mod k-125' },
      { code: 'Space', label: 'SPACE', cls: 'k-625' },
      { code: 'AltRight', label: 'ALT', cls: 'mod k-125' },
      { code: 'MetaRight', label: 'WIN', cls: 'mod k-125' },
      { code: 'ContextMenu', label: 'MENU', cls: 'mod k-125' },
      { code: 'ControlRight', label: 'CTRL', cls: 'mod k-125' },
      { spacer: true, w: 0.5 },
      { code: 'ArrowLeft', label: '◀', cls: 'mod k-1' },
      { code: 'ArrowDown', label: '▼', cls: 'mod k-1' },
      { code: 'ArrowRight', label: '▶', cls: 'mod k-1' }
    ]
  ],

  // --------------------------------------------------------------------------
  // 3. 75% COMPACT (84 Keys - Compact Studio Layout with F-Row & Column Nav)
  // --------------------------------------------------------------------------
  ansi_75: [
    // Row 1: Function Row + Del
    [
      { code: 'Escape', label: 'ESC', cls: 'accent-esc k-1' },
      { code: 'F1', label: 'F1', cls: 'mod k-1' },
      { code: 'F2', label: 'F2', cls: 'mod k-1' },
      { code: 'F3', label: 'F3', cls: 'mod k-1' },
      { code: 'F4', label: 'F4', cls: 'mod k-1' },
      { code: 'F5', label: 'F5', cls: 'mod k-1' },
      { code: 'F6', label: 'F6', cls: 'mod k-1' },
      { code: 'F7', label: 'F7', cls: 'mod k-1' },
      { code: 'F8', label: 'F8', cls: 'mod k-1' },
      { code: 'F9', label: 'F9', cls: 'mod k-1' },
      { code: 'F10', label: 'F10', cls: 'mod k-1' },
      { code: 'F11', label: 'F11', cls: 'mod k-1' },
      { code: 'F12', label: 'F12', cls: 'mod k-1' },
      { code: 'PrintScreen', label: 'PRT', cls: 'mod k-1' },
      { code: 'Delete', label: 'DEL', cls: 'mod k-1' }
    ],
    // Row 2: Numbers + Backspace + Home
    [
      { code: 'Backquote', label: '~', sub: '`', cls: 'k-1' },
      { code: 'Digit1', label: '!', sub: '1', cls: 'k-1' },
      { code: 'Digit2', label: '@', sub: '2', cls: 'k-1' },
      { code: 'Digit3', label: '#', sub: '3', cls: 'k-1' },
      { code: 'Digit4', label: '$', sub: '4', cls: 'k-1' },
      { code: 'Digit5', label: '%', sub: '5', cls: 'k-1' },
      { code: 'Digit6', label: '^', sub: '6', cls: 'k-1' },
      { code: 'Digit7', label: '&', sub: '7', cls: 'k-1' },
      { code: 'Digit8', label: '*', sub: '8', cls: 'k-1' },
      { code: 'Digit9', label: '(', sub: '9', cls: 'k-1' },
      { code: 'Digit0', label: ')', sub: '0', cls: 'k-1' },
      { code: 'Minus', label: '_', sub: '-', cls: 'k-1' },
      { code: 'Equal', label: '+', sub: '=', cls: 'k-1' },
      { code: 'Backspace', label: 'BKSP', cls: 'mod k-2' },
      { code: 'Home', label: 'HOME', cls: 'mod k-1' }
    ],
    // Row 3: Tab + QWERTY + Page Up
    [
      { code: 'Tab', label: 'TAB', cls: 'mod k-15' },
      { code: 'KeyQ', label: 'Q', cls: 'k-1' },
      { code: 'KeyW', label: 'W', cls: 'k-1' },
      { code: 'KeyE', label: 'E', cls: 'k-1' },
      { code: 'KeyR', label: 'R', cls: 'k-1' },
      { code: 'KeyT', label: 'T', cls: 'k-1' },
      { code: 'KeyY', label: 'Y', cls: 'k-1' },
      { code: 'KeyU', label: 'U', cls: 'k-1' },
      { code: 'KeyI', label: 'I', cls: 'k-1' },
      { code: 'KeyO', label: 'O', cls: 'k-1' },
      { code: 'KeyP', label: 'P', cls: 'k-1' },
      { code: 'BracketLeft', label: '{', sub: '[', cls: 'k-1' },
      { code: 'BracketRight', label: '}', sub: ']', cls: 'k-1' },
      { code: 'Backslash', label: '|', sub: '\\', cls: 'mod k-15' },
      { code: 'PageUp', label: 'PGUP', cls: 'mod k-1' }
    ],
    // Row 4: CapsLock + ASDF + Enter + Page Down
    [
      { code: 'CapsLock', label: 'CAPS', cls: 'mod k-175' },
      { code: 'KeyA', label: 'A', cls: 'k-1' },
      { code: 'KeyS', label: 'S', cls: 'k-1' },
      { code: 'KeyD', label: 'D', cls: 'k-1' },
      { code: 'KeyF', label: 'F', cls: 'k-1' },
      { code: 'KeyG', label: 'G', cls: 'k-1' },
      { code: 'KeyH', label: 'H', cls: 'k-1' },
      { code: 'KeyJ', label: 'J', cls: 'k-1' },
      { code: 'KeyK', label: 'K', cls: 'k-1' },
      { code: 'KeyL', label: 'L', cls: 'k-1' },
      { code: 'Semicolon', label: ':', sub: ';', cls: 'k-1' },
      { code: 'Quote', label: '"', sub: '\'', cls: 'k-1' },
      { code: 'Enter', label: 'ENTER', cls: 'accent-enter k-225' },
      { code: 'PageDown', label: 'PGDN', cls: 'mod k-1' }
    ],
    // Row 5: LShift + ZXCV + RShift + Up + End
    [
      { code: 'ShiftLeft', label: 'SHIFT', cls: 'mod k-225' },
      { code: 'KeyZ', label: 'Z', cls: 'k-1' },
      { code: 'KeyX', label: 'X', cls: 'k-1' },
      { code: 'KeyC', label: 'C', cls: 'k-1' },
      { code: 'KeyV', label: 'V', cls: 'k-1' },
      { code: 'KeyB', label: 'B', cls: 'k-1' },
      { code: 'KeyN', label: 'N', cls: 'k-1' },
      { code: 'KeyM', label: 'M', cls: 'k-1' },
      { code: 'Comma', label: '<', sub: ',', cls: 'k-1' },
      { code: 'Period', label: '>', sub: '.', cls: 'k-1' },
      { code: 'Slash', label: '?', sub: '/', cls: 'k-1' },
      { code: 'ShiftRight', label: 'SHIFT', cls: 'mod k-175' },
      { code: 'ArrowUp', label: '▲', cls: 'mod k-1' },
      { code: 'End', label: 'END', cls: 'mod k-1' }
    ],
    // Row 6: Bottom Modifiers + Space + Arrows
    [
      { code: 'ControlLeft', label: 'CTRL', cls: 'mod k-125' },
      { code: 'MetaLeft', label: 'WIN', cls: 'mod k-125' },
      { code: 'AltLeft', label: 'ALT', cls: 'mod k-125' },
      { code: 'Space', label: 'SPACE', cls: 'k-625' },
      { code: 'AltRight', label: 'ALT', cls: 'mod k-1' },
      { code: 'MetaRight', label: 'FN', cls: 'mod k-1' },
      { code: 'ControlRight', label: 'CTRL', cls: 'mod k-1' },
      { code: 'ArrowLeft', label: '◀', cls: 'mod k-1' },
      { code: 'ArrowDown', label: '▼', cls: 'mod k-1' },
      { code: 'ArrowRight', label: '▶', cls: 'mod k-1' }
    ]
  ],

  // --------------------------------------------------------------------------
  // 4. 65% SLIM (68 Keys - Dedicated Arrow Keys + Right Nav Column)
  // --------------------------------------------------------------------------
  ansi_65: [
    // Row 1: Numbers + Delete
    [
      { code: 'Escape', label: 'ESC', cls: 'accent-esc k-1' },
      { code: 'Digit1', label: '!', sub: '1', cls: 'k-1' },
      { code: 'Digit2', label: '@', sub: '2', cls: 'k-1' },
      { code: 'Digit3', label: '#', sub: '3', cls: 'k-1' },
      { code: 'Digit4', label: '$', sub: '4', cls: 'k-1' },
      { code: 'Digit5', label: '%', sub: '5', cls: 'k-1' },
      { code: 'Digit6', label: '^', sub: '6', cls: 'k-1' },
      { code: 'Digit7', label: '&', sub: '7', cls: 'k-1' },
      { code: 'Digit8', label: '*', sub: '8', cls: 'k-1' },
      { code: 'Digit9', label: '(', sub: '9', cls: 'k-1' },
      { code: 'Digit0', label: ')', sub: '0', cls: 'k-1' },
      { code: 'Minus', label: '_', sub: '-', cls: 'k-1' },
      { code: 'Equal', label: '+', sub: '=', cls: 'k-1' },
      { code: 'Backspace', label: 'BKSP', cls: 'mod k-2' },
      { code: 'Delete', label: 'DEL', cls: 'mod k-1' }
    ],
    // Row 2: Tab + QWERTY + PgUp
    [
      { code: 'Tab', label: 'TAB', cls: 'mod k-15' },
      { code: 'KeyQ', label: 'Q', cls: 'k-1' },
      { code: 'KeyW', label: 'W', cls: 'k-1' },
      { code: 'KeyE', label: 'E', cls: 'k-1' },
      { code: 'KeyR', label: 'R', cls: 'k-1' },
      { code: 'KeyT', label: 'T', cls: 'k-1' },
      { code: 'KeyY', label: 'Y', cls: 'k-1' },
      { code: 'KeyU', label: 'U', cls: 'k-1' },
      { code: 'KeyI', label: 'I', cls: 'k-1' },
      { code: 'KeyO', label: 'O', cls: 'k-1' },
      { code: 'KeyP', label: 'P', cls: 'k-1' },
      { code: 'BracketLeft', label: '{', sub: '[', cls: 'k-1' },
      { code: 'BracketRight', label: '}', sub: ']', cls: 'k-1' },
      { code: 'Backslash', label: '|', sub: '\\', cls: 'mod k-15' },
      { code: 'PageUp', label: 'PGUP', cls: 'mod k-1' }
    ],
    // Row 3: Caps + ASDF + Enter + PgDn
    [
      { code: 'CapsLock', label: 'CAPS', cls: 'mod k-175' },
      { code: 'KeyA', label: 'A', cls: 'k-1' },
      { code: 'KeyS', label: 'S', cls: 'k-1' },
      { code: 'KeyD', label: 'D', cls: 'k-1' },
      { code: 'KeyF', label: 'F', cls: 'k-1' },
      { code: 'KeyG', label: 'G', cls: 'k-1' },
      { code: 'KeyH', label: 'H', cls: 'k-1' },
      { code: 'KeyJ', label: 'J', cls: 'k-1' },
      { code: 'KeyK', label: 'K', cls: 'k-1' },
      { code: 'KeyL', label: 'L', cls: 'k-1' },
      { code: 'Semicolon', label: ':', sub: ';', cls: 'k-1' },
      { code: 'Quote', label: '"', sub: '\'', cls: 'k-1' },
      { code: 'Enter', label: 'ENTER', cls: 'accent-enter k-225' },
      { code: 'PageDown', label: 'PGDN', cls: 'mod k-1' }
    ],
    // Row 4: Shift + ZXCV + Up + End
    [
      { code: 'ShiftLeft', label: 'SHIFT', cls: 'mod k-225' },
      { code: 'KeyZ', label: 'Z', cls: 'k-1' },
      { code: 'KeyX', label: 'X', cls: 'k-1' },
      { code: 'KeyC', label: 'C', cls: 'k-1' },
      { code: 'KeyV', label: 'V', cls: 'k-1' },
      { code: 'KeyB', label: 'B', cls: 'k-1' },
      { code: 'KeyN', label: 'N', cls: 'k-1' },
      { code: 'KeyM', label: 'M', cls: 'k-1' },
      { code: 'Comma', label: '<', sub: ',', cls: 'k-1' },
      { code: 'Period', label: '>', sub: '.', cls: 'k-1' },
      { code: 'Slash', label: '?', sub: '/', cls: 'k-1' },
      { code: 'ShiftRight', label: 'SHIFT', cls: 'mod k-175' },
      { code: 'ArrowUp', label: '▲', cls: 'mod k-1' },
      { code: 'End', label: 'END', cls: 'mod k-1' }
    ],
    // Row 5: Bottom Modifiers + Space + Arrows
    [
      { code: 'ControlLeft', label: 'CTRL', cls: 'mod k-125' },
      { code: 'MetaLeft', label: 'WIN', cls: 'mod k-125' },
      { code: 'AltLeft', label: 'ALT', cls: 'mod k-125' },
      { code: 'Space', label: 'SPACE', cls: 'k-625' },
      { code: 'AltRight', label: 'ALT', cls: 'mod k-125' },
      { code: 'MetaRight', label: 'FN', cls: 'mod k-1' },
      { code: 'ArrowLeft', label: '◀', cls: 'mod k-1' },
      { code: 'ArrowDown', label: '▼', cls: 'mod k-1' },
      { code: 'ArrowRight', label: '▶', cls: 'mod k-1' }
    ]
  ],

  // --------------------------------------------------------------------------
  // 5. 60% MINI (61 Keys - Pure Standard Poker ANSI)
  // --------------------------------------------------------------------------
  ansi_60: [
    // Row 1: Numbers
    [
      { code: 'Escape', label: 'ESC', cls: 'accent-esc k-1' },
      { code: 'Digit1', label: '!', sub: '1', cls: 'k-1' },
      { code: 'Digit2', label: '@', sub: '2', cls: 'k-1' },
      { code: 'Digit3', label: '#', sub: '3', cls: 'k-1' },
      { code: 'Digit4', label: '$', sub: '4', cls: 'k-1' },
      { code: 'Digit5', label: '%', sub: '5', cls: 'k-1' },
      { code: 'Digit6', label: '^', sub: '6', cls: 'k-1' },
      { code: 'Digit7', label: '&', sub: '7', cls: 'k-1' },
      { code: 'Digit8', label: '*', sub: '8', cls: 'k-1' },
      { code: 'Digit9', label: '(', sub: '9', cls: 'k-1' },
      { code: 'Digit0', label: ')', sub: '0', cls: 'k-1' },
      { code: 'Minus', label: '_', sub: '-', cls: 'k-1' },
      { code: 'Equal', label: '+', sub: '=', cls: 'k-1' },
      { code: 'Backspace', label: 'BKSP', cls: 'mod k-2' }
    ],
    // Row 2: Tab + QWERTY
    [
      { code: 'Tab', label: 'TAB', cls: 'mod k-15' },
      { code: 'KeyQ', label: 'Q', cls: 'k-1' },
      { code: 'KeyW', label: 'W', cls: 'k-1' },
      { code: 'KeyE', label: 'E', cls: 'k-1' },
      { code: 'KeyR', label: 'R', cls: 'k-1' },
      { code: 'KeyT', label: 'T', cls: 'k-1' },
      { code: 'KeyY', label: 'Y', cls: 'k-1' },
      { code: 'KeyU', label: 'U', cls: 'k-1' },
      { code: 'KeyI', label: 'I', cls: 'k-1' },
      { code: 'KeyO', label: 'O', cls: 'k-1' },
      { code: 'KeyP', label: 'P', cls: 'k-1' },
      { code: 'BracketLeft', label: '{', sub: '[', cls: 'k-1' },
      { code: 'BracketRight', label: '}', sub: ']', cls: 'k-1' },
      { code: 'Backslash', label: '|', sub: '\\', cls: 'mod k-15' }
    ],
    // Row 3: Caps + ASDF + Enter
    [
      { code: 'CapsLock', label: 'CAPS', cls: 'mod k-175' },
      { code: 'KeyA', label: 'A', cls: 'k-1' },
      { code: 'KeyS', label: 'S', cls: 'k-1' },
      { code: 'KeyD', label: 'D', cls: 'k-1' },
      { code: 'KeyF', label: 'F', cls: 'k-1' },
      { code: 'KeyG', label: 'G', cls: 'k-1' },
      { code: 'KeyH', label: 'H', cls: 'k-1' },
      { code: 'KeyJ', label: 'J', cls: 'k-1' },
      { code: 'KeyK', label: 'K', cls: 'k-1' },
      { code: 'KeyL', label: 'L', cls: 'k-1' },
      { code: 'Semicolon', label: ':', sub: ';', cls: 'k-1' },
      { code: 'Quote', label: '"', sub: '\'', cls: 'k-1' },
      { code: 'Enter', label: 'ENTER', cls: 'accent-enter k-225' }
    ],
    // Row 4: Shift + ZXCV
    [
      { code: 'ShiftLeft', label: 'SHIFT', cls: 'mod k-225' },
      { code: 'KeyZ', label: 'Z', cls: 'k-1' },
      { code: 'KeyX', label: 'X', cls: 'k-1' },
      { code: 'KeyC', label: 'C', cls: 'k-1' },
      { code: 'KeyV', label: 'V', cls: 'k-1' },
      { code: 'KeyB', label: 'B', cls: 'k-1' },
      { code: 'KeyN', label: 'N', cls: 'k-1' },
      { code: 'KeyM', label: 'M', cls: 'k-1' },
      { code: 'Comma', label: '<', sub: ',', cls: 'k-1' },
      { code: 'Period', label: '>', sub: '.', cls: 'k-1' },
      { code: 'Slash', label: '?', sub: '/', cls: 'k-1' },
      { code: 'ShiftRight', label: 'SHIFT', cls: 'mod k-275' }
    ],
    // Row 5: Bottom Modifiers + Space
    [
      { code: 'ControlLeft', label: 'CTRL', cls: 'mod k-125' },
      { code: 'MetaLeft', label: 'WIN', cls: 'mod k-125' },
      { code: 'AltLeft', label: 'ALT', cls: 'mod k-125' },
      { code: 'Space', label: 'SPACE', cls: 'k-625' },
      { code: 'AltRight', label: 'ALT', cls: 'mod k-125' },
      { code: 'MetaRight', label: 'WIN', cls: 'mod k-125' },
      { code: 'ContextMenu', label: 'MENU', cls: 'mod k-125' },
      { code: 'ControlRight', label: 'CTRL', cls: 'mod k-125' }
    ]
  ]
};

class KeyboardTesterEngine {
  constructor(plateContainerId, synth) {
    this.container = document.getElementById(plateContainerId);
    this.synth = synth;
    this.currentLayout = 'ansi_100';

    // State Tracking
    this.activeKeys = new Set();
    this.testedKeys = new Set();
    this.keyPressCounts = {};
    this.maxSimultaneous = 0;
    this.totalKeystrokes = 0;
    this.keyPressStartTimes = {};
    this.latencies = [];

    this.isHeatmapMode = false;
    this.onMetricsChange = null;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  setLayout(layoutKey) {
    if (KEYBOARD_LAYOUTS[layoutKey]) {
      this.currentLayout = layoutKey;
      this.render();
      this.notifyMetrics();
    }
  }

  toggleHeatmapMode(enabled) {
    this.isHeatmapMode = enabled;
    this.updateHeatmapVisuals();
  }

  resetTester() {
    this.activeKeys.clear();
    this.testedKeys.clear();
    this.keyPressCounts = {};
    this.maxSimultaneous = 0;
    this.totalKeystrokes = 0;
    this.latencies = [];
    this.render();
    this.notifyMetrics();
  }

  render() {
    if (!this.container) return;
    const layout = KEYBOARD_LAYOUTS[this.currentLayout] || KEYBOARD_LAYOUTS.ansi_100;

    this.container.innerHTML = layout.map(row => {
      const keysHtml = row.map(key => {
        if (key.spacer) {
          const pixelWidth = Math.round(key.w * 48 + (key.w - 1) * 5);
          return `<div class="kb-spacer" style="width: ${pixelWidth}px; height: 48px; pointer-events: none;"></div>`;
        }

        const isTested = this.testedKeys.has(key.code) ? 'tested' : '';
        const isPressed = this.activeKeys.has(key.code) ? 'pressed' : '';
        const subHtml = key.sub ? `<span class="keycap-sub">${key.sub}</span>` : '';

        return `
          <div
            class="keycap ${key.cls} ${isTested} ${isPressed}"
            data-code="${key.code}"
            id="key_${key.code}"
            title="${key.label} (${key.code})"
          >
            ${subHtml}
            <span class="keycap-legend">${key.label}</span>
          </div>
        `;
      }).join('');

      return `<div class="kb-row">${keysHtml}</div>`;
    }).join('');

    this.updateHeatmapVisuals();
    this.notifyMetrics();
  }

  bindEvents() {
    // Physical Keyboard Events
    window.addEventListener('keydown', (e) => {
      // Prevent browser default actions on testing keys (like Tab, F-keys, Alt, Space scroll)
      if (['Tab', 'F1', 'F2', 'F3', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (!e.target.matches('input, textarea')) {
          e.preventDefault();
        }
      }

      this.handleKeyDown(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.handleKeyUp(e.code);
    });

    // Mouse / Touch clicking on virtual keycaps
    if (this.container) {
      this.container.addEventListener('mousedown', (e) => {
        const keyEl = e.target.closest('.keycap');
        if (keyEl && keyEl.dataset.code) {
          this.handleKeyDown(keyEl.dataset.code);
        }
      });

      window.addEventListener('mouseup', () => {
        this.activeKeys.forEach(code => {
          this.handleKeyUp(code);
        });
      });
    }
  }

  handleKeyDown(code) {
    if (this.activeKeys.has(code)) return; // prevent auto-repeat audio spam

    this.activeKeys.add(code);
    this.testedKeys.add(code);
    this.keyPressCounts[code] = (this.keyPressCounts[code] || 0) + 1;
    this.totalKeystrokes++;
    this.keyPressStartTimes[code] = performance.now();

    // Track NKRO Simultaneous
    if (this.activeKeys.size > this.maxSimultaneous) {
      this.maxSimultaneous = this.activeKeys.size;
    }

    // Play switch sound
    if (this.synth) {
      this.synth.playDownstroke(code);
    }

    // Update Visual State in 2D
    const keyEl = document.getElementById(`key_${code}`);
    if (keyEl) {
      keyEl.classList.add('pressed', 'tested');
    }

    this.updateHeatmapVisuals();
    this.notifyMetrics();
  }

  handleKeyUp(code) {
    if (!this.activeKeys.has(code)) return;

    this.activeKeys.delete(code);

    // Calculate latency
    if (this.keyPressStartTimes[code]) {
      const latency = performance.now() - this.keyPressStartTimes[code];
      this.latencies.push(latency);
      if (this.latencies.length > 50) this.latencies.shift();
      delete this.keyPressStartTimes[code];
    }

    // Play switch upstroke sound
    if (this.synth) {
      this.synth.playUpstroke(code);
    }

    // Update Visual State in 2D
    const keyEl = document.getElementById(`key_${code}`);
    if (keyEl) {
      keyEl.classList.remove('pressed');
    }

    this.notifyMetrics();
  }

  updateHeatmapVisuals() {
    if (!this.isHeatmapMode) {
      document.querySelectorAll('.keycap[data-heat-level]').forEach(el => {
        el.removeAttribute('data-heat-level');
      });
      return;
    }

    const counts = Object.values(this.keyPressCounts);
    if (counts.length === 0) return;
    const maxCount = Math.max(...counts, 1);

    Object.entries(this.keyPressCounts).forEach(([code, count]) => {
      const keyEl = document.getElementById(`key_${code}`);
      if (keyEl) {
        const ratio = count / maxCount;
        let level = 1;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.50) level = 3;
        else if (ratio > 0.25) level = 2;
        keyEl.setAttribute('data-heat-level', level);
      }
    });
  }

  getMetrics() {
    const layout = KEYBOARD_LAYOUTS[this.currentLayout] || KEYBOARD_LAYOUTS.ansi_100;
    let totalKeysInLayout = 0;
    layout.forEach(row => {
      row.forEach(k => {
        if (!k.spacer) totalKeysInLayout++;
      });
    });

    const avgLatency = this.latencies.length > 0
      ? Math.round(this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length)
      : 0;

    return {
      activeCount: this.activeKeys.size,
      maxSimultaneous: this.maxSimultaneous,
      testedCount: this.testedKeys.size,
      totalKeys: totalKeysInLayout,
      totalKeystrokes: this.totalKeystrokes,
      avgLatency
    };
  }

  notifyMetrics() {
    if (this.onMetricsChange) {
      this.onMetricsChange(this.getMetrics());
    }
  }
}

window.KEYBOARD_LAYOUTS = KEYBOARD_LAYOUTS;
window.KeyboardTesterEngine = KeyboardTesterEngine;

