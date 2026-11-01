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

## Grayscale conversion with OpenCV

For a BGR image loaded with OpenCV:

```python
gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
```

**Grayscale reduces a color image to one channel, retaining brightness information but discarding color differences.**
