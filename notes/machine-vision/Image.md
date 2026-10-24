---
title: Image
folder: machine-vision
stage: budding
created: 2026-10-24
lastTended: 2026-10-24
tags:
  - machine-vision
  - opencv
publish: true
---
## **Image**

> [!summary]- Mental Model
> ![[image_info.png]]

An image is a matrix of number

For a grayscale image:

```text
10   50   60
90   20   13
30  180  255
```

Every number is one pixel intensity:

```text
0   : Black
....
.... Shades of gray
....
255 : White
```

A grey scale image has shape:

```text
(rows, columns) or (height, width) // image.shape
```

## Image Coordinate

```text
(row, column) = (y, x)
```

So if you access:

```text
[10, 3]
```

That means:

```text
row    = y = 10
column = x = 3
```

not x = 10, y =3

For color images, each pixel has three channels:

```text
[R G B]
```

For example

```text
[255, 0, 0] => Red
[0, 255, 0] => Green
[0, 0, 255] => Blue
[255, 255, 255] => White
[0, 0, 0] => Black
```

A color image usually has shape:

```text
(height, width, 3) => (rows, columns, channels)
```

OpenCV often uses

```text
BGR instead of RGB
```

That is way we often use

```python
cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
```

when displaying OpenCV images with Matplotlib.
