"""对比 2.0 MNEnumLib.d.lua 与 2.0 维基枚举文档的差异"""

import requests
import sys
import io
import os
import re
from bs4 import BeautifulSoup, Tag

ENUM_LIB_URL: str = "https://dev-wiki.mini1.cn/wiki/673b36183ffc6baf0859d39f"
SCRIPT_DIR: str = os.path.dirname(os.path.abspath(__file__))
ENUM_LIB_FILE_PATH: str = os.path.abspath(
    os.path.join(SCRIPT_DIR, os.pardir, os.pardir, "multiple", "2.0", "MNEnumLib.d.lua")
)
CLASS_RE: str = r"--- @class"
FIELD_RE: str = r"--- @field"

# 维基页面中需要跳过的类名前缀/名称（不参与对比）
SKIP_CLASSES: set[str] = {
    "BLOCKID",  # 特殊项，不在本地 enum 库中
    # "CurEventParam",  # 事件参数类型，跳过
}


def init() -> None:
    """初始化输出编码"""
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def analyze_file(path: str) -> dict[str, list[str]]:
    """分析本地 Lua 声明文件，提取枚举类名和字段名

    Args:
        path (str): 文件路径

    Returns:
        dict[str, list[str]]: {类名: [字段名列表]}
    """
    out_dict: dict[str, list[str]] = {}
    class_name: str | None = None
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            if re.match(CLASS_RE, line):
                match: re.Match | None = re.search(r"--- @class (\w+)", line)
                if match:
                    current_class_name: str = match.group(1)
                    class_name = current_class_name
                    out_dict[current_class_name] = []
            elif re.match(FIELD_RE, line):
                match: re.Match | None = re.search(r"--- @field (\w+)", line)
                if match and class_name and class_name in out_dict:
                    field_name: str = match.group(1)
                    out_dict[class_name].append(field_name)

    return out_dict


def analyze_web(url: str) -> dict[str, list[str]]:
    """从 2.0 维基页面中提取枚举定义

    维基页面中的枚举表格格式为：名称 | 数值 | 用法描述
    名称列格式为: ClassName.FieldName

    Args:
        url (str): 维基页面 URL

    Returns:
        dict[str, list[str]]: {本地类名: [字段名列表]}
    """
    out_dict: dict[str, list[str]] = {}
    response: requests.Response = requests.get(url, timeout=15)
    response.encoding = "utf-8"
    soup: BeautifulSoup = BeautifulSoup(response.text, "html.parser")
    all_tables: list[Tag] = soup.find_all("table")

    for table in all_tables:
        rows: list[Tag] = table.find_all("tr")
        if not rows:
            continue

        # 找到第一个包含数据的行（跳过表头行）
        first_data_row: Tag | None = None
        for row in rows:
            cells: list[Tag] = row.find_all(["td", "th"])
            if not cells:
                continue
            text: str = cells[0].get_text(strip=True)
            # 跳过表头行和空行
            if text in ("名称", "数据名称", "字符串", ""):
                continue
            first_data_row = row
            break

        if not first_data_row:
            continue

        first_cell: Tag | None = first_data_row.td
        if not first_cell:
            continue

        first_text: str = first_cell.get_text(strip=True)
        if "." not in first_text:
            # 不含点号，不是枚举表（如 Lua 类型表、变量类型表、按键值表）
            continue

        wiki_class_name: str = first_text.split(".", 1)[0]

        # 跳过不需要对比的类
        if wiki_class_name in SKIP_CLASSES:
            continue

        current_fields: list[str] = []
        for row in rows:
            field_cell: Tag | None = row.td
            if not field_cell or not field_cell.get_text(strip=True):
                continue

            field_text: str = field_cell.get_text(strip=True)
            if "." not in field_text:
                continue

            row_class: str = field_text.split(".", 1)[0]
            if row_class != wiki_class_name:
                # 跳过不同类的行（理论上不会发生，但防御性检查）
                continue

            current_fields.append(field_text.split(".", 1)[1])

        # 合并同名类的字段，去重
        if wiki_class_name in out_dict:
            existing: list[str] = out_dict[wiki_class_name]
            for f in current_fields:
                if f not in existing:
                    existing.append(f)
        else:
            out_dict[wiki_class_name] = current_fields

    return out_dict


def compare_enums(
    local_enums: dict[str, list[str]], web_enums: dict[str, list[str]]
) -> list[str]:
    """比较本地枚举定义和网页枚举定义之间的差异

    Args:
        local_enums (dict[str, list[str]]): 本地文件中的枚举定义
        web_enums (dict[str, list[str]]): 网页中的枚举定义

    Returns:
        list[str]: 差异描述列表
    """
    diff_lines: list[str] = []
    all_classes: list[str] = sorted(set(local_enums) | set(web_enums))

    for class_name in all_classes:
        local_fields: set[str] = set(local_enums.get(class_name, []))
        web_fields: set[str] = set(web_enums.get(class_name, []))

        if class_name not in local_enums:
            diff_lines.append(f"此class只在网页: {class_name}")
            continue
        if class_name not in web_enums:
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


def main() -> None:
    """主函数"""
    init()

    if not os.path.exists(ENUM_LIB_FILE_PATH):
        print(f"错误：本地枚举文件不存在: {ENUM_LIB_FILE_PATH}")
        return

    print(f"分析本地文件: {ENUM_LIB_FILE_PATH}")
    local_enums: dict[str, list[str]] = analyze_file(ENUM_LIB_FILE_PATH)
    print(f"  本地共 {len(local_enums)} 个枚举类\n")

    print(f"抓取维基页面: {ENUM_LIB_URL}")
    web_enums: dict[str, list[str]] = analyze_web(ENUM_LIB_URL)
    print(f"  网页共 {len(web_enums)} 个枚举类\n")

    diff_lines: list[str] = compare_enums(local_enums, web_enums)

    if not diff_lines:
        print("没有不同之处，枚举定义完全一致")
        return

    print("发现的差异：")
    for line in diff_lines:
        print(line)


if __name__ == "__main__":
    main()
