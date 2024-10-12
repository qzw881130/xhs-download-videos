import { existsSync } from 'fs';  // 添加这行

const filepath = `/Volumes/Mydisk_800/test/e/img_AB0t25WNy0ROH67EU9Jb4aJ3D1hjLTqhOHE3u3F17MTks=.jpg`

if (!existsSync(filepath)) {
    console.log(`Image file not found: ${filepath}`);
} else {
    console.log('Image exist')
}