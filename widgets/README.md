# Declarative Widgets

Put a JSON object in a fenced `widget` block. The reader builds its controls and
views automatically; there is no topic-specific widget type or registration.
In Obsidian and other readers without this renderer, the block remains readable
JSON rather than an interactive widget.

## Formula example

```widget
{
  "title": "Circle area",
  "controls": [
    { "id": "radius", "type": "number", "label": "Radius", "min": 0, "max": 100, "value": 3 }
  ],
  "views": [
    { "id": "area", "type": "metric", "label": "Area", "expression": "pi * radius ** 2", "precision": 2 }
  ]
}
```

## Matrix example

```widget
{
  "title": "Scale matrix values",
  "data": { "samples": [[10, 20], [30, 40]] },
  "controls": [
    { "id": "gain", "type": "range", "label": "Scale factor", "min": 0, "max": 3, "step": 0.25, "value": 1 }
  ],
  "views": [
    { "id": "original", "type": "matrix", "label": "Original", "source": "samples" },
    { "id": "scaled", "type": "matrix", "label": "Scaled", "source": "samples", "map": "value * gain" },
    { "id": "average", "type": "metric", "label": "Mean", "expression": "mean(scaled)", "precision": 2 }
  ]
}
```

See [Thresholding](Thresholding.md) for a matrix comparison
with a slider, checkbox, and calculated count, using exactly the same renderer.

Other note experiments use the same schema without custom JavaScript:

- [Grayscale](Grayscale.md): compare average and weighted conversion with RGB sliders.
- [Kernel](Kernel.md): vary one pixel and observe a neighborhood's mean.
- [Filtering Geometry](Filtering%20Geometry.md): explore how input, kernel, stride, and padding change output size.

## Configuration

- `title`: optional visible title, at most 120 characters.
- `data`: named finite numbers, booleans, numeric vectors, or numeric matrices.
- `controls`: up to 12 `range`, `number`, `checkbox`, or `select` controls.
- `views`: between 1 and 12 `matrix` or `metric` views.
- IDs must be unique across data, controls, and views. Use letters, digits, and
  underscores, beginning with a letter. Names are case-sensitive.

Numeric controls accept `min`, `max`, `step`, and `value`, defaulting to `0`,
`100`, `1`, and the minimum respectively. Values must align with the step.
Checkbox values are booleans, defaulting to `false`. Select controls use a unique
array of text `options`; `value` defaults to the first option.

Matrix views name a `source` and optionally a per-cell `map` expression. Inside
that expression, `value` is the current cell, and `row` and `column` are zero-based
indices. An optional `scale: [minimum, maximum]` colors cells from black to white;
values outside the scale are visually clamped, not numerically changed.
Matrices are limited to 20 rows and 20 columns, and display numeric values only.

Metric views use an `expression` and optionally a `total` expression to display
`result / total`. `precision` controls rounding for either view, from 0 to 6
decimal places. Calculations use unrounded values.

Views are evaluated in declaration order. A later view can reference an earlier
view's ID, such as `mean(scaled)`. Invalid input shows an error without removing
the controls. Correcting the input recalculates the views.

## Expressions

Expressions can reference data, control IDs, earlier view IDs, and `pi`.
Matrix maps also provide `value`, `row`, and `column`. These names and function
names are reserved and cannot be used as IDs.

- Arithmetic: `+`, `-`, `*`, `/`, `%`, `**` and parentheses.
- Comparisons: `>`, `>=`, `<`, `<=`, `==`, `!=`, `===`, `!==`.
- Logic: `!`, `&&`, `||`, and `condition ? yes : no`.
- Scalar functions: `abs`, `round`, `floor`, `ceil`, `sqrt`.
- Aggregates: `min`, `max`, `sum`, `mean`, and `size`, each taking one argument.
- `count(values, target)` counts values equal to the target.

Aggregates accept a numeric value, vector, or matrix; matrices are flattened.
Array literals and element/property access are not supported. Put arrays in
`data`, and use a matrix map or an aggregate to work with them.

Expressions are parsed with the vendored jsep library and interpreted by a
restricted evaluator. They are not JavaScript: assignment, property access,
arbitrary function calls, HTML, and scripts cannot be embedded in a note.
Expressions are limited to 512 characters, 128 syntax nodes, and depth 24.

## Files

- [renderer.js](renderer.js): schema validation, Markdown integration, rendering,
  and delegated input handling.
- [expressions.js](expressions.js): restricted expression evaluation.
- [template.html](template.html): shared widget containers.
- [styles.css](05%20Garden/widgets/styles.css): shared responsive control, matrix, and metric styles.
- [tests.cjs](tests.cjs): expression safety, schema, and documented-example checks.

To add another experiment, add a `widget` block to its note. Extend the renderer
only when a genuinely new control or view primitive is needed, not for each topic.
GitHub Pages deployment copies this directory and the vendored parser automatically.

## Tests

From the repository root, run:

```shell
node --test widgets/tests.cjs
```
