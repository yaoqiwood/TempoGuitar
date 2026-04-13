# Windows 同步脚本说明（WSL -> Windows）

本文档说明以下两个脚本的区别和使用方法：

- `scripts/sync-to-windows.sh`
- `scripts/auto-sync-to-windows.sh`

说明：你上一条消息里把同一个路径写了两次。仓库中实际有两个同步脚本，分别是上面这两个。

## 1. 这两个脚本有什么区别

| 对比项 | `sync-to-windows.sh` | `auto-sync-to-windows.sh` |
| --- | --- | --- |
| 同步方式 | 单次同步（执行一次就结束） | 持续同步（常驻监听变更） |
| 触发方式 | 手动触发 | 文件变化自动触发（优先 inotify；否则轮询） |
| 适用场景 | 提交前、手动备份、临时同步 | 开发过程中保持 Windows 目录实时更新 |
| 退出方式 | 执行完自动退出 | `Ctrl + C` 手动停止 |
| 额外参数 | `--dry-run`、`--delete` | `--dry-run`、`--delete`、`--poll`、`--interval`、`--debounce-ms` |

## 2. 共同点

- 默认目标目录都是：`/mnt/c/dev/TempoGuitar`
- 都是单向同步：`WSL 项目目录 -> Windows 目录`
- 都依赖 `rsync`
- 都会排除以下目录/文件：
  - `.git/`
  - `.codex`
  - `node_modules/`
  - `src-tauri/target/`
  - `dist/`
  - `.DS_Store`

## 3. 使用前准备

在 WSL 里安装依赖：

```bash
sudo apt update
sudo apt install -y rsync inotify-tools
```

说明：
- `rsync` 是必须的。
- `inotify-tools` 不是硬性必须，但安装后 `auto-sync-to-windows.sh` 可以使用更及时、更省资源的监听模式。

## 4. `sync-to-windows.sh`（单次同步）怎么用

在项目根目录执行：

```bash
./scripts/sync-to-windows.sh
```

指定目标目录：

```bash
./scripts/sync-to-windows.sh /mnt/c/dev/TempoGuitar
```

仅预览改动（不真正写入）：

```bash
./scripts/sync-to-windows.sh --dry-run
```

镜像同步（会删除目标目录中源目录不存在的文件）：

```bash
./scripts/sync-to-windows.sh --delete
```

## 5. `auto-sync-to-windows.sh`（自动持续同步）怎么用

启动自动同步：

```bash
./scripts/auto-sync-to-windows.sh
```

镜像模式自动同步：

```bash
./scripts/auto-sync-to-windows.sh --delete
```

强制轮询模式（不用 inotify）：

```bash
./scripts/auto-sync-to-windows.sh --poll --interval 2
```

调节 inotify 去抖间隔（默认 350ms）：

```bash
./scripts/auto-sync-to-windows.sh --debounce-ms 500
```

停止自动同步：

```bash
Ctrl + C
```

## 6. 参数说明速查

### `sync-to-windows.sh`

- `--dry-run`：只显示将要同步的内容，不写入
- `--delete`：删除目标目录中多余文件（危险操作，建议先 `--dry-run`）

### `auto-sync-to-windows.sh`

- `--dry-run`：只显示将要同步的内容，不写入
- `--delete`：开启镜像模式，删除目标多余文件
- `--poll`：强制使用轮询，不用 inotify
- `--interval <sec>`：轮询间隔秒数（默认 `1.5`）
- `--debounce-ms <ms>`：inotify 触发去抖时间（默认 `350`）

## 7. 推荐用法

- 日常开发：开一个终端长期运行 `./scripts/auto-sync-to-windows.sh`
- 发版前检查：先执行 `./scripts/sync-to-windows.sh --dry-run`
- 需要严格镜像：确认无误后再加 `--delete`

## 8. 常见问题

### Q1：为什么目标目录文件没有被删除？

默认不会删除目标目录多余文件。需要显式加 `--delete`。

### Q2：自动同步时 CPU 占用偏高？

可能在轮询模式。可安装 `inotify-tools`，并去掉 `--poll`。

### Q3：可以从 Windows 改动反向同步回 WSL 吗？

这两个脚本都不支持。当前仅支持 `WSL -> Windows` 单向同步。
