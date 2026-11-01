---
title: Grayscale
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-11-01
lastTended: 2026-11-01
tags:
  - machine-vision
  - course-note
  - image-processing
  - opencv
publish: true
---
**An RGB color [[Image|image]] has three channels:**

$$
(R, G, B)
$$

**A grayscale [[Image|image]] has one intensity value per pixel:**

$$
P = I
$$

## Converting color to grayscale

A simple approach is to average the three channels:

$$
P = \frac{R + G + B}{3}
$$

However, this does not account for how differently human vision perceives the brightness of different colors.

A commonly used weighted conversion is:

$$
Y = 0.299R + 0.587G + 0.114B
$$

Here, $Y$ is a luma value calculated from gamma-encoded RGB channels using BT.601 weights. It approximates perceived brightness rather than physical luminance.

Green has the largest weight; blue has the smallest.

## Compare channel contributions

With pure red, green, or blue at `255`, the simple average is always `85`. The weighted conversion gives different results because the channel weights differ. Equal red, green, and blue values produce the same result under both methods.

```widget
{
  "title": "RGB to grayscale",
  "controls": [
    { "id": "red", "type": "range", "label": "Red", "min": 0, "max": 255, "value": 255 },
    { "id": "green", "type": "range", "label": "Green", "min": 0, "max": 255, "value": 0 },
    { "id": "blue", "type": "range", "label": "Blue", "min": 0, "max": 255, "value": 0 }
  ],
  "views": [
    { "id": "average", "type": "metric", "label": "Simple average", "expression": "(red + green + blue) / 3", "precision": 2 },
    { "id": "luma", "type": "metric", "label": "Weighted grayscale", "expression": "0.299 * red + 0.587 * green + 0.114 * blue", "precision": 2 }
  ]
}
```

These are unrounded calculations displayed to two decimal places. An 8-bit OpenCV output stores integer values.

## Grayscale conversion with OpenCV

For a BGR image loaded with OpenCV:

```python
gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
```

**Grayscale reduces a color image to one channel, retaining brightness information but discarding color differences.**

Inspect the resulting intensities with an [[Image Histogram|image histogram]], or use [[Thresholding|thresholding]] to separate pixels into foreground and background.
