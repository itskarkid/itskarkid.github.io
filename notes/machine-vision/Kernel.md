---
title: Kernel
folder: machine-vision
stage: evergreen
created: 2026-10-25
lastTended: 2026-10-25
tags:
  - course-note
  - machine-vision
  - image-processing
  - image-filtering
publish: true
---
A **kernel** is a small matrix used to calculate a new pixel value from a local neighborhood of an [[Image|image]].

> [!summary]- Mental Model
> ![[kernel.png]]


The main idea is:
```text
Pixel
  ↓
Look at nearby pixels
  ↓
Apply kernel weights
  ↓
Calculate new center value
```

The kernel size determines **how large a neighborhood each pixel can see**.
```text
3×3 kernel
→ sees a 3×3 neighbourhood

5×5 kernel
→ sees a 5×5 neighbourhood

7×7 kernel
→ sees a 7×7 neighbourhood
```

A simple averaging kernel is:
$$
K = \frac{1}{9}
\begin{bmatrix}
1 & 1 & 1 \\
1 & 1 & 1 \\
1 & 1 & 1
\end{bmatrix}
$$

This means all 9 pixels in the neighborhood contribute equally.

Suppose the image neighborhood is:

$$
\begin{bmatrix}
10 & 10 & 10 \\
10 & 100 & 10 \\
10 & 10 & 10
\end{bmatrix}
$$
The kernel uses all these values to calculate a new value for the current pixel.
For this averaging kernel:
$$
\frac{10+10+10+10+100+10+10+10+10}{9} = 20
$$

So the current pixel changes from:
```text
100 → 20
```
The bright pixel becomes closer to its neighbors, which creates a smoothing effect.

Odd kernel sizes such as:
```text
3×3
5×5
7×7
```
are commonly used because they have one clear center position.

For example:
```text
3×3 kernel

1 1 1
1 C 1
1 1 1
```
`C` is the center of the neighborhood.

Different kernel values produce different effects such as:
```text
blur
sharpening
edge detection
noise reduction
```