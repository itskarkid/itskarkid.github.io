const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { marked } = require('../__support/vendor/marked.umd.js');

const root = path.resolve(__dirname, '..');
const read = filename => fs.readFileSync(path.join(root, filename), 'utf8');
const context = vm.createContext({
  URL,
  document: {
    currentScript: { src: 'http://localhost/widgets/renderer.js' },
    addEventListener() {}
  }
});
for (const filename of ['__support/vendor/jsep/jsep.iife.min.js', 'widgets/expressions.js', 'widgets/renderer.js']) {
  vm.runInContext(read(filename), context, { filename });
}
const calculate = (expression, values = {}) => context.GardenExpressions.compile(expression)(values);

test('arithmetic, conditions, and aggregates are topic-independent', () => {
  assert.equal(calculate('pi * radius ** 2', { radius: 3 }), Math.PI * 9);
  assert.equal(calculate('enabled ? amount * 2 : amount', { enabled: true, amount: 4 }), 8);
  assert.equal(calculate('mean(samples)', { samples: [[1, 2], [3, 4]] }), 2.5);
  assert.equal(calculate('size(samples)', { samples: [[1, 2], [3, 4]] }), 4);
  assert.equal(calculate('count(samples, 2)', { samples: [[1, 2], [2, 4]] }), 2);
  assert.equal(calculate('false && missing'), false);
});

test('executable expressions and non-finite results are rejected', () => {
  for (const expression of [
    'window.location', 'samples.constructor', 'fetch("/")', 'constructor(1)',
    'amount = 1', '[1, 2]', 'this', 'globalThis["fetch"]("/")',
    'sum.constructor("return 1")()', '1 / 0', 'sqrt(-1)'
  ]) {
    assert.throws(() => calculate(expression, { amount: 0 }), expression);
  }
  assert.throws(() => calculate('amount + 1', { amount: [1, 2] }));
  assert.throws(() => calculate('('.repeat(30) + '1 + '.repeat(130) + '1' + ')'.repeat(30)));
});

test('schema rejects invalid names, data, controls, and expressions', () => {
  const view = { id: 'answer', type: 'metric', expression: '2 + 2' };
  const invalid = [
    { controls: [{ id: 'constructor', type: 'number' }], views: [view] },
    { data: { samples: [[1], [1, 2]] }, views: [view] },
    { controls: [{ id: 'amount', type: 'range', min: 10, max: 0 }], views: [view] },
    { controls: [{ id: 'amount', type: 'range', step: 2, value: 3 }], views: [view] },
    { controls: [{ id: 'enabled', type: 'checkbox', value: 'yes' }], views: [view] },
    { controls: [{ id: 'mode', type: 'select', options: ['same', 'same'] }], views: [view] },
    { views: [{ ...view, expression: 'document.cookie' }] },
    { views: [{ ...view, precision: 9 }] },
    { data: { samples: [[1]] }, views: [{ id: 'samples', type: 'matrix', source: 'samples' }] }
  ];
  for (const config of invalid) assert.throws(() => context.GardenWidgets.validate(config));
});

test('all documented configurations evaluate correctly', () => {
  const expected = new Map([
    ['Circle area', ['area', Math.PI * 9]],
    ['Scale matrix values', ['average', 25]],
    ['Binary threshold experiment', ['white', 11]]
  ]);
  for (const filename of ['widgets/README.md', 'notes/machine-vision/Thresholding.md']) {
    for (const token of marked.lexer(read(filename)).filter(token => token.type === 'code' && token.lang === 'widget')) {
      const settings = context.GardenWidgets.validate(JSON.parse(token.text));
      const values = Object.assign(Object.create(null), settings.data,
        Object.fromEntries(settings.controls.map(control => [control.id, control.value])));
      for (const view of settings.views) {
        values[view.id] = view.type === 'matrix'
          ? values[view.source].map((row, rowIndex) => row.map((value, column) => view.map
            ? calculate(view.map, { ...values, value, row: rowIndex, column }) : value))
          : calculate(view.expression, values);
      }
      const [id, value] = expected.get(settings.title);
      assert.equal(values[id], value, settings.title);
      expected.delete(settings.title);
    }
  }
  assert.equal(expected.size, 0);
});