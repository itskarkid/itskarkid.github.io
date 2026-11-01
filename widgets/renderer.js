(() => {
  const templateUrl = new URL('template.html', document.currentScript.src);
  let template = null;
  let nextId = 0;

  function label(value, fallback = '') {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || value.length > 120) throw new Error('Labels must be text of at most 120 characters.');
    return value;
  }

  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e9;
  }

  function matrix(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 20
      || !Array.isArray(value[0]) || value[0].length < 1 || value[0].length > 20
      || !value.every(row => Array.isArray(row) && row.length === value[0].length && row.every(finite))) {
      throw new Error('Matrices must be rectangular numeric arrays, at most 20 by 20.');
    }
    return value;
  }

  function validate(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('A widget must be a JSON object.');
    const data = Object.create(null);
    const names = new Set();
    const name = value => {
      if (!GardenExpressions.isName(value) || GardenExpressions.reserved.has(value) || names.has(value)) {
        throw new Error('Data, controls, and views need unique, non-reserved identifier names.');
      }
      names.add(value);
      return value;
    };
    if (config.data !== undefined) {
      if (!config.data || typeof config.data !== 'object' || Array.isArray(config.data)
        || Object.keys(config.data).length > 24) throw new Error('Data must be an object with at most 24 values.');
      for (const [id, value] of Object.entries(config.data)) {
        name(id);
        if (Array.isArray(value)) {
          if (value.every(finite) && value.length > 0 && value.length <= 400) data[id] = [...value];
          else data[id] = matrix(value).map(row => [...row]);
        } else if (finite(value) || typeof value === 'boolean') data[id] = value;
        else throw new Error('Data values must be finite numbers, booleans, numeric vectors, or matrices.');
      }
    }
    if (config.controls !== undefined && !Array.isArray(config.controls)) throw new Error('Controls must be an array.');
    if ((config.controls || []).length > 12) throw new Error('Use at most 12 controls.');
    const controls = (config.controls || []).map(control => {
      if (!control || !['range', 'number', 'checkbox', 'select'].includes(control.type)) throw new Error('Unknown control type.');
      const settings = { id: name(control.id), type: control.type, label: label(control.label, control.id) };
      if (control.type === 'checkbox') {
        if (control.value !== undefined && typeof control.value !== 'boolean') throw new Error('Checkbox values must be true or false.');
        settings.value = control.value ?? false;
      } else if (control.type === 'select') {
        if (!Array.isArray(control.options) || !control.options.length || control.options.length > 20
          || !control.options.every(option => typeof option === 'string' && option.length <= 80)
          || new Set(control.options).size !== control.options.length) throw new Error('Select options must be unique text values.');
        settings.options = [...control.options];
        settings.value = control.value ?? settings.options[0];
        if (!settings.options.includes(settings.value)) throw new Error('Select an available option.');
      } else {
        settings.min = control.min ?? 0;
        settings.max = control.max ?? 100;
        settings.step = control.step ?? 1;
        settings.value = control.value ?? settings.min;
        if (![settings.min, settings.max, settings.step, settings.value].every(finite)
          || settings.min >= settings.max || settings.step <= 0
          || settings.value < settings.min || settings.value > settings.max) throw new Error('Numeric control limits, step, or value are invalid.');
        const steps = (settings.value - settings.min) / settings.step;
        if (Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error('The initial value must align with the control step.');
      }
      return settings;
    });
    if (!Array.isArray(config.views) || !config.views.length || config.views.length > 12) throw new Error('Specify between 1 and 12 views.');
    const views = config.views.map(view => {
      if (!view || !['matrix', 'metric'].includes(view.type)) throw new Error('Unknown view type.');
      const sourceNames = new Set(names);
      const settings = { id: name(view.id), type: view.type, label: label(view.label, view.id), precision: view.precision ?? 6 };
      if (!Number.isInteger(settings.precision) || settings.precision < 0 || settings.precision > 6) throw new Error('Precision must be an integer from 0 to 6.');
      if (view.type === 'matrix') {
        if (!sourceNames.has(view.source)) throw new Error('Matrix source must name data or an earlier view.');
        settings.source = view.source;
        if (view.map !== undefined) {
          GardenExpressions.compile(view.map);
          settings.map = view.map;
        }
        if (view.scale !== undefined) {
          if (!Array.isArray(view.scale) || view.scale.length !== 2 || !view.scale.every(finite)
            || view.scale[0] >= view.scale[1]) throw new Error('A matrix scale needs an increasing numeric pair.');
          settings.scale = [...view.scale];
        }
      } else {
        GardenExpressions.compile(view.expression);
        settings.expression = view.expression;
        if (view.total !== undefined) {
          GardenExpressions.compile(view.total);
          settings.total = view.total;
        }
      }
      return settings;
    });
    return { title: label(config.title), data, controls, views };
  }

  async function initialize() {
    try {
      const response = await fetch(templateUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      template = DOMPurify.sanitize(await response.text());
    } catch (error) {
      console.error('Unable to load widget template', error);
    }
  }

  function errorMessage(message) {
    const element = document.createElement('p');
    element.className = 'garden-widget-error';
    element.setAttribute('role', 'alert');
    element.textContent = `Widget unavailable: ${message}`;
    return element;
  }

  function mount(element, config) {
    const heading = document.createElement('h3');
    heading.className = 'garden-widget-title';
    heading.textContent = config.title;
    if (config.title) element.prepend(heading);
    element.setAttribute('aria-label', config.title || 'Interactive experiment');
    const controls = element.querySelector('[data-widget-controls]');
    for (const control of config.controls) {
      const row = document.createElement('div');
      row.className = `garden-widget-control garden-widget-control-${control.type}`;
      const caption = document.createElement('label');
      const input = document.createElement(control.type === 'select' ? 'select' : 'input');
      input.id = `${element.id}-${control.id}`;
      input.dataset.control = control.id;
      caption.htmlFor = input.id;
      caption.textContent = control.label;
      if (control.type === 'select') {
        for (const value of control.options) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          option.toggleAttribute('selected', value === control.value);
          input.append(option);
        }
      } else {
        input.type = control.type;
        if (control.type === 'checkbox') input.toggleAttribute('checked', control.value);
        else {
          for (const key of ['min', 'max', 'step', 'value']) input.setAttribute(key, control[key]);
        }
      }
      if (control.type === 'checkbox') row.append(input, caption);
      else row.append(caption, input);
      if (control.type === 'range') {
        const output = document.createElement('output');
        output.htmlFor = input.id;
        output.dataset.controlValue = control.id;
        row.append(output);
      }
      controls.append(row);
    }
    for (const view of config.views) {
      const container = element.querySelector(view.type === 'matrix' ? '[data-widget-views]' : '[data-widget-metrics]');
      if (view.type === 'matrix') {
        const table = document.createElement('table');
        table.className = 'garden-widget-matrix';
        const caption = table.createCaption();
        caption.textContent = view.label;
        table.createTBody().dataset.view = view.id;
        container.append(table);
      } else {
        const row = document.createElement('div');
        row.className = 'garden-widget-metric';
        const caption = document.createElement('span');
        caption.textContent = view.label;
        const output = document.createElement('output');
        output.dataset.view = view.id;
        output.setAttribute('aria-live', 'polite');
        row.append(caption, output);
        container.append(row);
      }
    }
  }

  function update(element, config) {
    const values = Object.assign(Object.create(null), config.data);
    for (const control of config.controls) {
      const input = element.querySelector(`[data-control="${control.id}"]`);
      let value;
      if (control.type === 'checkbox') value = input.checked;
      else if (control.type === 'select') {
        value = input.value;
        if (!control.options.includes(value)) throw new Error('Select an available option.');
      } else {
        value = input.valueAsNumber;
        if (!finite(value) || value < control.min || value > control.max || !input.validity.valid) {
          throw new Error(`${control.label} must be a valid number from ${control.min} to ${control.max}.`);
        }
      }
      values[control.id] = value;
      const output = element.querySelector(`[data-control-value="${control.id}"]`);
      if (output) output.textContent = value;
    }
    const format = (value, precision) => typeof value === 'number' ? String(Number(value.toFixed(precision))) : String(value);
    for (const view of config.views) {
      const target = element.querySelector(`[data-view="${view.id}"]`);
      if (view.type === 'matrix') {
        const source = matrix(values[view.source]);
        const calculate = view.map ? GardenExpressions.compile(view.map) : null;
        const output = source.map((row, rowIndex) => row.map((value, column) => calculate
          ? calculate(Object.assign(Object.create(null), values, { value, row: rowIndex, column })) : value));
        matrix(output);
        values[view.id] = output;
        target.replaceChildren();
        for (const row of output) {
          const tableRow = target.insertRow();
          for (const value of row) {
            const cell = tableRow.insertCell();
            cell.textContent = format(value, view.precision);
            if (view.scale) {
              const shade = Math.round(Math.max(0, Math.min(1, (value - view.scale[0]) / (view.scale[1] - view.scale[0]))) * 255);
              cell.style.backgroundColor = `rgb(${shade}, ${shade}, ${shade})`;
              cell.style.color = shade > 118 ? '#000' : '#fff';
            }
          }
        }
      } else {
        const result = GardenExpressions.compile(view.expression)(values);
        if (!['number', 'boolean', 'string'].includes(typeof result) || String(result).length > 200) throw new Error('Metrics must produce a scalar value.');
        values[view.id] = result;
        let text = format(result, view.precision);
        if (view.total) {
          const total = GardenExpressions.compile(view.total)(values);
          if (!finite(total)) throw new Error('Metric totals must be finite numbers.');
          text += ` / ${format(total, view.precision)}`;
        }
        target.textContent = text;
      }
    }
  }

  function render(source) {
    try {
      if (source.length > 32768) throw new Error('Widget configuration is too large.');
      const settings = validate(JSON.parse(source));
      if (template === null) throw new Error('The shared widget template could not be loaded.');
      const element = document.createElement('section');
      element.className = 'garden-widget';
      element.id = `garden-widget-${++nextId}`;
      element.dataset.widgetConfig = JSON.stringify(settings);
      element.innerHTML = template;
      mount(element, settings);
      update(element, settings);
      return element.outerHTML;
    } catch (error) {
      return errorMessage(error.message).outerHTML;
    }
  }

  function install(markdown) {
    markdown.use({
      renderer: {
        code(token) {
          return token.lang === 'widget' ? render(token.text) : false;
        }
      }
    });
  }

  function handleInput(event) {
    if (!event.target.matches('[data-control]')) return;
    const element = event.target.closest('.garden-widget[data-widget-config]');
    if (!element) return;
    const message = element.querySelector('[data-widget-message]');
    try {
      update(element, validate(JSON.parse(element.dataset.widgetConfig)));
      message.textContent = '';
      message.hidden = true;
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
    }
  }

  document.addEventListener('input', handleInput);
  document.addEventListener('change', handleInput);
  globalThis.GardenWidgets = { validate, initialize, install, render };
})();