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
publish: true
---
**A color [[Image|image]] has three channel:**

$$(R, G, B)$$
**A greyscale [[Image|image]] has only one intensity value:**
$$P = I$$
**But how do we convert three numbers into one?**

A simple way is to calculate average
$$P = \frac{R + G + B}{3}$$
However, this does not account for how differently human being perceive the brightness of different colors.

A commonly used weighted conversion is:

$$Y = 0.299R + 0.599G + 0.114B$$

Here, $Y$ approximates perceived brightness for standard gamma-encoded RGB images.

Notice that green has the largest weight, blue the smallest.

## Grayscale conversion with OpenCV

We can convert a color image using one line:

```python
cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAy)
```

**Grayscale reduces a color image to a single channel while preserving intensity information.**