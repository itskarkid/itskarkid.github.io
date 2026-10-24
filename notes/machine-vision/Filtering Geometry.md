---
title: Filtering Geometry
folder: machine-vision
stage: evergreen
created: 2026-10-26
lastTended: 2026-10-26
tags: [course-note, machine-vision, image-processing, convolution]
publish: true
---
**Filtering geometry** describes how the input [[Image|image]] size, [[Kernel|kernel]] size, [[Stride|stride]], and [[Padding|padding]] determine the size of the filtered output.  **Filtering geometry tells us how the spatial size of the image changes during filtering

> [!summary]- Mental Model
> ![[filtering-geometry.png]]


The general relationship is:

$$ 
O=  
\left\lfloor  
\frac{N-K+2P}{S}  
\right\rfloor+1  
$$

where:

```
N = input size
K = kernel size
P = padding
S = stride
O = output size
```

The main idea is:

```
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

### No Padding

Suppose:

```
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

```
5×5 input
3×3 kernel
stride 1
no padding

→ 3×3 output
```

The output becomes smaller because the kernel cannot be centred on the boundary pixels.

### With Padding

Now suppose:

```
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

```
5×5 input
3×3 kernel
stride 1
padding 1

→ 5×5 output
```

[[Padding|Padding]] allows the border pixels to be processed, so the output size can remain the same as the input.

### Larger Stride

Suppose:

```
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

```
5×5 input
3×3 kernel
stride 2

→ 2×2 output
```

A larger [[Stride|stride]] means the [[Kernel|kernel]] visits fewer positions, so the output becomes smaller.