#!/bin/bash

# 定义背景色（例如白色）
BACKGROUND_COLOR="#ec6b74"

# 遍历当前目录中的所有 PNG 文件并去除背景色
for file in *.png; do
    echo "Processing $file..."
    magick "$file" -transparent "$BACKGROUND_COLOR" "$file"
done

echo "Batch processing complete!"

cd ../
iconutil -c icns icon.iconset
rm -rf Elegantthemes-Beautiful-Flat-Flower.icns
mv icon.icns Elegantthemes-Beautiful-Flat-Flower.icns