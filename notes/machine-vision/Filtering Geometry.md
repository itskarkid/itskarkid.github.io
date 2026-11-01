---
title: Filtering Geometry
folder: machine-vision
stage: evergreen
confidence: high
created: 2026-10-26
lastTended: 2026-11-01
tags: [course-note, machine-vision, image-processing, convolution]
publish: true
---
**Filtering geometry** describes how the input [[Image|image]] size, [[Kernel|kernel]] size, [[Stride|stride]], and [[Padding|padding]] determine the size of the filtered output.

> [!summary]- Mental Model
> ![[filtering-geometry.png]]

For a kernel with no dilation and equal padding on both sides, the output size along one dimension is:

$$
O=  
\left\lfloor  
\frac{N-K+2P}{S}  
\right\rfloor+1  
$$

where:

```text
N = input size
K = kernel size
P = padding
S = stride
O = output size
```

Apply this formula separately to height and width, using the corresponding kernel size, stride, and padding. The padded input must be at least as large as the kernel.

The main idea is:

```text
Input image
   ↓
Kernel size
   +
Stride
   +
Padding
   ↓
Output size
```

## Explore output size

This example uses a square image, an odd square kernel, and the same stride and padding in both directions. Each valid kernel position produces one output pixel. The input is always at least as large as the kernel.

```widget
{
   "title": "Filtering output size",
   "controls": [
      { "id": "inputSize", "type": "number", "label": "Input side length", "min": 5, "max": 15, "value": 5 },
      { "id": "kernelSize", "type": "range", "label": "Kernel side length", "min": 1, "max": 5, "step": 2, "value": 3 },
      { "id": "stride", "type": "range", "label": "Stride", "min": 1, "max": 4, "value": 1 },
      { "id": "padding", "type": "range", "label": "Padding per side", "min": 0, "max": 3, "value": 0 }
   ],
   "views": [
      { "id": "side", "type": "metric", "label": "Output side length", "expression": "floor((inputSize - kernelSize + 2 * padding) / stride) + 1", "precision": 0 },
      { "id": "pixels", "type": "metric", "label": "Output pixels", "expression": "side ** 2", "precision": 0 }
   ]
}
```

With input `5` and kernel `3`, stride `1` and padding `0` give a `3×3` output. Padding `1` gives `5×5`; changing to stride `2` and padding `0` gives `2×2`. These are the worked examples below.

## No Padding

Suppose:

```text
Input   = 5
Kernel  = 3
Stride  = 1
Padding = 0
```

Then:

$$
O=  
\left\lfloor  
\frac{5-3}{1}  
\right\rfloor+1  
=3  
$$

So:

```text
5×5 input
3×3 kernel
stride 1
no padding

→ 3×3 output
```

The output becomes smaller because the kernel cannot be centred on the boundary pixels.

## With Padding

Now suppose:

```text
Input   = 5
Kernel  = 3
Stride  = 1
Padding = 1
```

Then:

$$
O=  
\left\lfloor  
\frac{5-3+2(1)}{1}  
\right\rfloor+1  
=5  
$$

So:

```text
5×5 input
3×3 kernel
stride 1
padding 1

→ 5×5 output
```

[[Padding|Padding]] allows the border pixels to be processed, so the output size can remain the same as the input.

## Larger Stride

Suppose:

```text
Input   = 5
Kernel  = 3
Stride  = 2
Padding = 0
```

Then:

$$
O=  
\left\lfloor  
\frac{5-3}{2}  
\right\rfloor+1  
=2  
$$

So:

```text
5×5 input
3×3 kernel
stride 2

→ 2×2 output
```

A larger [[Stride|stride]] means the [[Kernel|kernel]] visits fewer positions, so the output becomes smaller.
