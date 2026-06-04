import os

# 自定义顺序定义
ORDER_DEFINITION: list[str] = [
    "MNGlobalFunc",  # 全局函数
    "MNEnumLib",  # 枚举库
    "MNData",  # 数据
    "MNTable",  # 表格
    "MNArray",  # 数组
    "MNComponent",  # 组件
    "MNEvent",  # 事件
    "MNTimer",  # 计时器
    "MNMod",  # 模组
    "MNWorldContainer",  # 世界容器
    "MNWorld",  # 世界
    "MNMap",  # 地图
    "MNBlock",  # 方块
    "MNGameObject",  # 游戏对象
    "MNActor",  # 角色
    "MNPlayer",  # 玩家
    "MNMonster",  # 怪物
    "MNArea",  # 区域
    "MNBuff",  # Buff
    "MNItem",  # 物品
    "MNBackpack",  # 背包
    "MNChat",  # 聊天
    "MNCustomUI",  # 自定义UI
    "MNGraphics",  # 图形
]


def get_ordered_files(folder_path: str) -> list[str]:
    """获取指定顺序的文件列表
    Args:
        folder_path (str): 文件夹路径
    Returns:
        list[str]: 有序文件列表
    """

    # 获取文件夹中的所有.lua文件
    all_files: list[str] = [f for f in os.listdir(folder_path) if f.endswith(".lua")]

    # 按照定义顺序排序
    ordered_files: list[str] = []
    for name in ORDER_DEFINITION:
        filename: str = f"{name}.d.lua"
        if filename in all_files:
            ordered_files.append(filename)
            all_files.remove(filename)

    # 添加未在顺序定义中的其他文件
    if all_files:
        ordered_files.extend(sorted(all_files))

    return ordered_files


def merge_lua_files(folder_path: str) -> None:
    """合并多个.lua文件
    Args:
        folder_path (str): 文件夹路径
    Returns:
        None: 无返回值
    """
    # 获取有序文件列表
    ordered_files: list[str] = get_ordered_files(folder_path)

    if not ordered_files:
        print("错误：未找到任何.lua文件")
        return

    # 合并内容
    merged_content: list[str] = []
    total_lines: int = 0

    # 合并文件
    for filename in ordered_files:
        file_path: str = os.path.join(folder_path, filename)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content: str = f.read()

            # 统计行数
            lines: list[str] = content.split("\n")
            file_lines: int = len(lines)
            total_lines += file_lines

            # 添加文件内容并在文件尾部添加换行
            merged_content.append(content)
            merged_content.append("\n")  # 每个文件后添加换行

        except Exception as e:
            print(f"错误：处理文件 {filename} 时出错 - {e}")

    # 写入输出文件
    try:
        with open("merged.lua", "w", encoding="utf-8") as f:
            f.write("\n".join(merged_content))

        print(f"合并完成！合并了 {len(ordered_files)} 个文件，总 {total_lines} 行")

    except Exception as e:
        print(f"错误：写入输出文件时出错 - {e}")


def main():
    """主函数
    Returns:
        None: 无返回值
    """
    folder_path: str = "multiple"

    # 检查文件夹是否存在
    if not os.path.exists(folder_path):
        print(f"错误：文件夹 '{folder_path}' 不存在")
        return

    # 执行合并
    merge_lua_files(folder_path)


if __name__ == "__main__":
    main()
