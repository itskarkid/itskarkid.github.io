---
title: Thresholding
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-11-01
lastTended: 2026-11-01
tags:
  - machine-vision
  - image-processing
  - course-note
  - thresholding
  - opencv
publish: false
---
Binary thresholding converts a [[Grayscale|grayscale]] [[Image|image]] into a binary image by comparing each pixel's intensity against a threshold $T$.

For example, using OpenCV's binary thresholding:

$$
I_{\text{binary}}(x,y) =
\begin{cases}
255 & \text{if } I(x,y) > T \\
0 & \text{otherwise}
\end{cases}
$$

The result has only two pixel values: 0 (black) and 255 (white).

## Worked example

With $T = 100$, intensities `50`, `100`, and `200` become `0`, `0`, and `255`. A pixel equal to the threshold remains black under OpenCV's `THRESH_BINARY` rule.

## Binary thresholding with OpenCV

For an 8-bit, single-channel array named `gray`:

```python
import cv2

threshold_used, binary = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)
```