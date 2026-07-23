"""通用对比逻辑：函数名差异、枚举定义差异"""


def compare_funcs(
    local_funcs: set[str], web_funcs: set[str], module_name: str
) -> list[str]:
    """比较本地和网页函数名，返回差异描述行

    Args:
        local_funcs: 本地函数名集合
        web_funcs: 网页函数名集合
        module_name: 模块名称（用于输出标识）

    Returns:
        差异描述行列表
    """
    diff_lines: list[str] = []
    if not local_funcs and not web_funcs:
        diff_lines.append(f"[{module_name}] 未找到本地函数，也未提取到网页函数。")
        return diff_lines
    if not local_funcs:
        diff_lines.append(f"[{module_name}] 本地文件未解析到函数或本地文件缺失。")
    if not web_funcs:
        diff_lines.append(
            f"[{module_name}] 网页未解析到函数，请检查文档页面或解析规则。"
        )
    only_local = sorted(local_funcs - web_funcs)
    only_web = sorted(web_funcs - local_funcs)
    if only_local:
        diff_lines.append(f"[{module_name}] 仅在本地存在函数:")
        diff_lines.extend(f"  - {name}" for name in only_local)
    if only_web:
        diff_lines.append(f"[{module_name}] 仅在网页存在函数:")
        diff_lines.extend(f"  - {name}" for name in only_web)
    return diff_lines


def compare_enums(
    local_enums: dict[str, list[str]],
    web_enums: dict[str, list[str]],
    skip_classes: set[str] | None = None,
    skip_web_only_classes: set[str] | None = None,
    skip_local_only_classes: set[str] | None = None,
    skip_fields: dict[str, set[str]] | None = None,
) -> list[str]:
    """比较本地枚举定义和网页枚举定义之间的差异

    Args:
        local_enums: 本地文件中的枚举定义 {类名: [字段名列表]}
        web_enums: 网页中的枚举定义 {类名: [字段名列表]}
        skip_classes: 完全跳过对比的类名集合
        skip_web_only_classes: 不报告"仅在网页"的类名集合
        skip_local_only_classes: 不报告"仅在本地"的类名集合
        skip_fields: 跳过特定类的特定字段 {类名: {字段名集合}}

    Returns:
        差异描述列表
    """
    skip_classes = skip_classes or set()
    skip_web_only_classes = skip_web_only_classes or set()
    skip_local_only_classes = skip_local_only_classes or set()
    skip_fields = skip_fields or {}

    diff_lines: list[str] = []
    all_classes: list[str] = sorted(set(local_enums) | set(web_enums))

    for class_name in all_classes:
        if class_name in skip_classes:
            continue

        local_fields: set[str] = set(local_enums.get(class_name, []))
        web_fields: set[str] = set(web_enums.get(class_name, []))

        # 排除需要跳过的字段
        skipped = skip_fields.get(class_name, set())
        local_fields -= skipped
        web_fields -= skipped

        if class_name not in local_enums:
            if class_name not in skip_web_only_classes:
                diff_lines.append(f"此class只在网页: {class_name}")
            continue
        if class_name not in web_enums:
            if class_name not in skip_local_only_classes:
                diff_lines.append(f"此class只在本地: {class_name}")
            continue

        only_local: list[str] = sorted(local_fields - web_fields)
        only_web: list[str] = sorted(web_fields - local_fields)

        if only_local or only_web:
            diff_lines.append(f"Class: {class_name}")
            for field in only_web:
                diff_lines.append(f"  此field只在网页: {field}")
            for field in only_local:
                diff_lines.append(f"  此field只在本地: {field}")

    return diff_lines
