---
title: Padding
folder: machine-vision
stage: evergreen
created: 2026-10-26
lastTended: 2026-10-26
tags:
  - course-note
  - machine-vision
  - image-processing
  - convolution
  - padding
publish: true
---
**Padding** adds extra pixels around the border of an image so the kernel can also process edge pixels.

> [!summary]- Mental Model
> ![[padding.png]]


Without padding, the kernel cannot fully fit at the image boundary.

Suppose the image is:

```
10 20 30
40 50 60
70 80 90
```

If a `3×3` kernel is centered on the top-left pixel, some values would lie outside the image:

```
?  ?  ?
? 10 20
? 40 50
```

Padding provides values for those missing positions.

## Zero Padding

Add zeros around the image:

```
0  0  0  0  0
0 10 20 30  0
0 40 50 60  0
0 70 80 90  0
0  0  0  0  0
```

Now the kernel can also be centred on edge pixels.

So:

```
without padding
→ fewer valid kernel positions
→ smaller output

with padding
→ edge pixels can be processed
→ output size can be preserved
```

For odd-sized kernels, a common rule for preserving image size is:

$$
P=\frac{K-1}{2}  
$$

where:

```
P = padding
K = kernel size
```

Examples:

```
3×3 kernel → padding 1

5×5 kernel → padding 2

7×7 kernel → padding 3
```

Padding is not always zero.

Common padding types are:

```
Zero
→ add 0 outside the image

Replicate
→ repeat the nearest edge value

Reflect
→ mirror nearby image values
```

### Why does this matter?

Because padded values are also used in the kernel calculation.

For example:

```
zero padding
→ may make bright edges darker

replicate padding
→ keeps edge values more consistent

reflect padding
→ often gives smoother boundaries
```

The key mental model is:

```
Padding
→ controls what the kernel sees outside the real image boundary
```

And together:

```
Kernel size
→ how much area is seen

Stride
→ how far the kernel moves

Padding
→ what happens at the border
```