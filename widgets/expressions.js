(() => {
  const cache = new Map();
  const flatten = input => Array.isArray(input) ? input.flat() : [input];
  const numeric = input => {
    const values = flatten(input);
    if (!values.length || !values.every(value => typeof value === 'number' && Number.isFinite(value))) {
      throw new Error('This calculation needs finite numeric values.');
    }
    return values;
  };
  const functions = Object.freeze({
    abs: value => Math.abs(numeric(value)[0]),
    round: value => Math.round(numeric(value)[0]),
    floor: value => Math.floor(numeric(value)[0]),
    ceil: value => Math.ceil(numeric(value)[0]),
    sqrt: value => Math.sqrt(numeric(value)[0]),
    min: input => Math.min(...numeric(input)),
    max: input => Math.max(...numeric(input)),
    sum: input => numeric(input).reduce((total, value) => total + value, 0),
    mean: input => {
      const values = numeric(input);
      return values.reduce((total, value) => total + value, 0) / values.length;
    },
    size: input => flatten(input).length,
    count: (input, target) => flatten(input).filter(value => value === target).length
  });
  const binary = Object.freeze({
    '+': (left, right) => left + right,
    '-': (left, right) => left - right,
    '*': (left, right) => left * right,
    '/': (left, right) => left / right,
    '%': (left, right) => left % right,
    '**': (left, right) => left ** right,
    '>': (left, right) => left > right,
    '>=': (left, right) => left >= right,
    '<': (left, right) => left < right,
    '<=': (left, right) => left <= right,
    '==': (left, right) => left === right,
    '!=': (left, right) => left !== right,
    '===': (left, right) => left === right,
    '!==': (left, right) => left !== right
  });
  const reserved = new Set(['value', 'row', 'column', 'pi', ...Object.keys(functions)]);

  function isName(name) {
    return typeof name === 'string' && /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(name)
      && !Object.hasOwn(Object.prototype, name);
  }

  function compile(expression) {
    if (typeof expression !== 'string' || expression.length < 1 || expression.length > 512) {
      throw new Error('Expressions must contain between 1 and 512 characters.');
    }
    if (cache.has(expression)) return cache.get(expression);
    const tree = jsep(expression);
    let nodes = 0;

    function validate(node, depth = 0) {
      if (++nodes > 128 || depth > 24) throw new Error('Expression is too complex.');
      switch (node.type) {
        case 'Literal':
          if (!['number', 'boolean', 'string'].includes(typeof node.value)) throw new Error('Unsupported literal.');
          return;
        case 'Identifier':
          if (!isName(node.name)) throw new Error('Unsupported variable name.');
          return;
        case 'UnaryExpression':
          if (!['!', '+', '-'].includes(node.operator)) throw new Error('Unsupported unary operator.');
          validate(node.argument, depth + 1);
          return;
        case 'BinaryExpression':
          if (!Object.hasOwn(binary, node.operator) && !['&&', '||'].includes(node.operator)) throw new Error('Unsupported operator.');
          validate(node.left, depth + 1);
          validate(node.right, depth + 1);
          return;
        case 'ConditionalExpression':
          validate(node.test, depth + 1);
          validate(node.consequent, depth + 1);
          validate(node.alternate, depth + 1);
          return;
        case 'CallExpression':
          if (node.callee.type !== 'Identifier' || !Object.hasOwn(functions, node.callee.name)
            || node.arguments.length !== (node.callee.name === 'count' ? 2 : 1)) {
            throw new Error('Only documented calculation functions are allowed.');
          }
          node.arguments.forEach(argument => validate(argument, depth + 1));
          return;
        default:
          throw new Error('Property access, assignment, and executable JavaScript are not allowed.');
      }
    }

    function evaluate(node, values) {
      switch (node.type) {
        case 'Literal': return node.value;
        case 'Identifier':
          if (node.name === 'pi') return Math.PI;
          if (!Object.hasOwn(values, node.name)) throw new Error(`Unknown variable: ${node.name}`);
          return values[node.name];
        case 'UnaryExpression': {
          const value = evaluate(node.argument, values);
          if (node.operator === '!') return !value;
          if (typeof value !== 'number') throw new Error('Arithmetic needs numeric values.');
          return node.operator === '-' ? -value : value;
        }
        case 'BinaryExpression': {
          const left = evaluate(node.left, values);
          if (node.operator === '&&') return left && evaluate(node.right, values);
          if (node.operator === '||') return left || evaluate(node.right, values);
          const right = evaluate(node.right, values);
          if (Array.isArray(left) || Array.isArray(right)) throw new Error('Use an aggregate function for arrays.');
          if (['+', '-', '*', '/', '%', '**'].includes(node.operator)
            && (typeof left !== 'number' || typeof right !== 'number')) throw new Error('Arithmetic needs numeric values.');
          return binary[node.operator](left, right);
        }
        case 'ConditionalExpression':
          return evaluate(node.test, values) ? evaluate(node.consequent, values) : evaluate(node.alternate, values);
        case 'CallExpression':
          return functions[node.callee.name](...node.arguments.map(argument => evaluate(argument, values)));
      }
    }

    validate(tree);
    const calculation = values => {
      const result = evaluate(tree, values);
      if (typeof result === 'number' && !Number.isFinite(result)) throw new Error('Calculation produced a non-finite result.');
      return result;
    };
    if (cache.size >= 128) cache.delete(cache.keys().next().value);
    cache.set(expression, calculation);
    return calculation;
  }

  globalThis.GardenExpressions = { compile, isName, reserved };
})();