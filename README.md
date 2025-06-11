# Blitzscale-doc
This is document for blitz-scale!

# Usage
Use mdbook as document edit tool.
## Install
```bash
# 使用cargo安装mdbook
cargo install --git https://github.com/rust-lang/mdBook.git mdbook
```
## Build
```bash
# 1. 根据markdown文档构建html
mdbook build
# 2. 通过http server在浏览器预览
mdbook serve --open
```

## Edit
1. 在src/SUMMARY.md中编辑文档层级
2. 在SUMMARY.md编辑后会自动创建对应md文档(http server启动时)
3. 在文档中编辑即可，mdbook http server会实时同步更改
