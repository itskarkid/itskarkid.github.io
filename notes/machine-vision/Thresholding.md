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
publish: true
---
Thresholding is a simple form of image segmentation: it separates pixels into groups using their intensities. It often helps distinguish an object from its background.

This note builds on [[Grayscale|grayscale images]] and the [[Image Histogram|image histogram]].

## Binary thresholding

Binary thresholding converts a grayscale [[Image|image]] into a binary image by comparing each pixel's intensity against a threshold $T$.

For example, using OpenCV's binary thresholding:

$$
I_{\text{binary}}(x,y) =
\begin{cases}
255 & \text{if } I(x,y) > T \\
0 & \text{otherwise}
\end{cases}
$$

The result has only two pixel values: 0 (black) and 255 (white).

For normal binary thresholding, a pixel equal to $T$ becomes black. Increasing $T$ can only decrease or preserve the number of white pixels when the input image stays fixed.

## Threshold experiment

```widget
{
  "title": "Binary threshold experiment",
  "data": {
    "pixels": [
      [30, 70, 120, 180, 230],
      [40, 100, 150, 210, 250],
      [20, 90, 140, 200, 240],
      [60, 110, 170, 220, 255]
    ]
  },
  "controls": [
    { "id": "threshold", "type": "range", "label": "Threshold T", "min": 0, "max": 255, "value": 125 },
    { "id": "inverse", "type": "checkbox", "label": "Inverse binary threshold", "value": false }
  ],
  "views": [
    { "id": "original", "type": "matrix", "label": "Original", "source": "pixels", "scale": [0, 255] },
    {
      "id": "binary",
      "type": "matrix",
      "label": "Thresholded",
      "source": "pixels",
      "map": "(inverse ? value <= threshold : value > threshold) ? 255 : 0",
      "scale": [0, 255]
    },
    { "id": "white", "type": "metric", "label": "White pixels", "expression": "count(binary, 255)", "total": "size(binary)" }
  ]
}
```

At $T = 125$, normal thresholding makes 11 of these 20 pixels white. Inverse thresholding makes the other 9 white.

## Global thresholding with OpenCV

A global threshold uses one value for the entire image.

```python
import cv2
import numpy as np

image = np.array([
  [30, 70, 120, 180, 230],
  [40, 100, 150, 210, 250],
  [20, 90, 140, 200, 240],
  [60, 110, 170, 220, 255]
], dtype=np.uint8)

threshold_used, binary = cv2.threshold(image, 125, 255, cv2.THRESH_BINARY)

print("Threshold returned:", threshold_used)
print(binary)
```

The binary output is:

```text
[[  0   0   0 255 255]
 [  0   0 255 255 255]
 [  0   0 255 255 255]
 [  0   0 255 255 255]]
```

The arguments are the input image, threshold, output value above the threshold, and thresholding mode. `threshold_used` is `125.0` here; `binary` is the output array.

## Inverse thresholding

`THRESH_BINARY_INV` makes pixels with intensity **at or below** $T$ white and pixels above $T$ black:

$$
I_{\text{inverse}}(x,y) =
\begin{cases}
255 & \text{if } I(x,y) \le T \\
0 & \text{otherwise}
\end{cases}
$$

For example, with $T = 100$, intensities `99`, `100`, and `101` become `255`, `255`, and `0`.

```python
threshold_used, inverse = cv2.threshold(image, 100, 255, cv2.THRESH_BINARY_INV)
```

White is a mask convention, not necessarily a bright object: inverse thresholding can represent a dark line as a white foreground region.

## Choosing a thresholding method

| Method | Threshold choice | Useful starting point |
| --- | --- | --- |
| Global | One manually chosen value | Fairly consistent illumination |
| Otsu | One automatically chosen value | Two reasonably distinct intensity groups |
| Adaptive | A threshold from each local neighborhood | Uneven illumination or shadows |

A darkened part of a white background can fall below a fixed global threshold and be mistaken for an object. No method is guaranteed to work for every image.

## Otsu's method

Otsu's method chooses a global threshold from the histogram by maximizing the between-class variance:

$$
\sigma_b^2(T) = w_0(T)w_1(T)\left[\mu_0(T)-\mu_1(T)\right]^2
$$

- $w_0$ and $w_1$ are the proportions of pixels in each class.
- $\mu_0$ and $\mu_1$ are their mean intensities.

The idea is to separate two groups as well as possible. Otsu works best when that two-group assumption suits the image; it does not automatically compensate for uneven lighting.

For an 8-bit, single-channel array named `gray`:

```python
otsu_threshold, otsu_binary = cv2.threshold(
  gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
)
print("Otsu threshold:", otsu_threshold)
```

The supplied `0` is ignored when Otsu selects the threshold. A small [[Blur|blur]] can help with noisy inputs, but it can also remove fine detail.

## Adaptive thresholding

Adaptive thresholding calculates a threshold for each pixel from a local neighborhood. OpenCV offers a local mean or a Gaussian-weighted local mean, minus a constant $C$.

```python
adaptive_binary = cv2.adaptiveThreshold(
  gray,
  255,
  cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
  cv2.THRESH_BINARY,
  11,
  2
)
```

- `gray` must be an 8-bit, single-channel image.
- `11` is the neighborhood width and height. It must be odd and greater than 1.
- `2` is the constant subtracted from the weighted local mean.

Both parameters need tuning. A neighborhood that is too small can follow texture or noise instead of the foreground/background distinction.

## Compare the three methods

Replace `image.png` with a local image containing the foreground and background you want to separate.

```python
import cv2
import matplotlib.pyplot as plt

gray = cv2.imread("image.png", cv2.IMREAD_GRAYSCALE)
if gray is None:
  raise FileNotFoundError("Could not load image.png")

global_threshold, global_binary = cv2.threshold(
  gray, 127, 255, cv2.THRESH_BINARY
)
otsu_threshold, otsu_binary = cv2.threshold(
  gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
)
adaptive_binary = cv2.adaptiveThreshold(
  gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
  cv2.THRESH_BINARY, 11, 2
)

images = [gray, global_binary, otsu_binary, adaptive_binary]
titles = [
  "Grayscale", "Global (T=127)",
  f"Otsu (T={otsu_threshold:.0f})", "Adaptive"
]

figure, axes = plt.subplots(1, 4, figsize=(16, 4))
for axis, current_image, title in zip(axes, images, titles):
  axis.imshow(current_image, cmap="gray", vmin=0, vmax=255)
  axis.set_title(title)
  axis.axis("off")

plt.tight_layout()
plt.show()
```

Compare missed foreground pixels and incorrectly selected background pixels, not just how visually clean the result looks.

## Robotics example: a black line

For an existing, non-empty grayscale image named `gray`, an inverse threshold can identify dark markings against a lighter surface:

```python
threshold_used, mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)

dark_pixels = cv2.countNonZero(mask)
percentage = 100 * dark_pixels / mask.size
print(f"Dark region: {percentage:.2f}%")
```

This measures the fraction of image pixels classified as dark, not the physical area of the line. Lighting, shadows, threshold choice, and camera geometry all affect the result.

## Knowledge check

A black line lies on a white floor. One side is in shadow and the other is brightly illuminated. Which method is a reasonable starting point?

- A fixed global threshold of 127
- Otsu's global threshold
- Adaptive thresholding
- Converting the image to RGB

> [!question]- Answer
> Adaptive thresholding is a reasonable starting point because it uses local intensity information. It is not guaranteed to be best; inspect the resulting mask and tune the neighborhood size and constant.
