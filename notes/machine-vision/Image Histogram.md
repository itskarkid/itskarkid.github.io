---
title: Image Histogram
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
A histogram shows how frequently each pixel intensity occurs in an image.

For an 8-bit grayscale image:

- The horizontal axis represents intensity, from 0 (black) to 255 (white).
- The vertical axis represents the number of pixels having that intensity.
![[image_histogram.png]]

## Why are histograms useful?

Imagine a robot viewing a black line on a white floor.

The image might contain a large number of bright pixels (the floor) and a smaller number of dark pixels (the line).

A histogram can help us select an intensity threshold to separate them.

![[why_histogram.png]]

## Calculate a histogram in Python

```python
# cv2.calcHist()
hist = cv2.calcHist(
    [gray],       # Input images
    [0],          # Channel index
    None,         # No mask
    [256],        # Number of bins
    [0, 256]      # Intensity range
)

plt.plot(hist)
plt.title("Grayscale Histogram")
plt.xlabel("Pixel Intensity")
plt.ylabel("Pixel Count")
plt.xlim(0, 255)
plt.show()
```

**using NumPy**

```python
counts = np.bincount(gray.ravel(), minlength=256)
```

## Practical robotics connection

![[image_hostogram_in_robotics.png]]