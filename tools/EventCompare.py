import requests
import sys
import io
import os
import re
from bs4 import BeautifulSoup, Tag

TRIGGER_EVENT_URL = "https://dev-wiki.mini1.cn/ugc-wiki/apis/triggerevent.html"
COMPONENT_EVENT_URL = "https://dev-wiki.mini1.cn/ugc-wiki/apis/componentevent.html"
LOCAL_FILE_PATH = os.path.join(os.getcwd(), "multiple", "MNEvent.d.lua")

# 网页上可能包含但不希望报差异的字段
IGNORE_WEB_FIELDS = {"eventworldid"}

CLASS_RE = r"--- @class"
FIELD_RE = r"--- @field"


def init() -> None:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def analyze_file(path: str) -> dict[str, list[str]]:
    out_dict: dict[str, list[str]] = {}
    class_name: str | None = None
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            if re.match(CLASS_RE, line):
                match = re.search(r"--- @class (\w+)", line)
                if match:
                    current_class_name = match.group(1)
                    class_name = current_class_name
                    out_dict[current_class_name] = []
            elif re.match(FIELD_RE, line):
                match = re.search(r"--- @field (\w+)", line)
                if match and class_name and class_name in out_dict:
                    field_name = match.group(1)
                    out_dict[class_name].append(field_name)

    return out_dict


def analyze_web(url: str) -> dict[str, list[str]]:
    out_dict: dict[str, list[str]] = {}
    try:
        response = requests.get(url, timeout=10)
        response.encoding = "utf-8"
        text = response.text
    except Exception as e:
        print(f"请求失败: {url} -> {e}")
        return out_dict

    # 更稳健的解析：直接在页面文本中查找 TriggerEvent/ObjectEvent/CurEventParam 的条目
    # 只匹配 ASCII 字母/数字/下划线的事件名，避免捕获中文描述
    pattern = re.compile(r"(TriggerEvent|ObjectEvent|CurEventParam)\.([A-Za-z0-9_]+)")
    matches = pattern.findall(text)
    if not matches:
        return out_dict

    groups: dict[str, set[str]] = {}
    for cls, fld in matches:
        groups.setdefault(cls, set()).add(fld)

    for k, s in groups.items():
        out_dict[k] = sorted(s)

    return out_dict


def compare_events(local: dict[str, list[str]], web: dict[str, list[str]]) -> list[str]:
    diff_lines: list[str] = []
    all_classes = sorted(set(local) | set(web))
    for class_name in all_classes:
        local_fields = set(local.get(class_name, []))
        web_fields = set(web.get(class_name, []))
        if class_name not in local:
            diff_lines.append(f"此class只在网页: {class_name}")
            continue
        if class_name not in web:
            diff_lines.append(f"此class只在本地: {class_name}")
            continue
        only_local = sorted(local_fields - web_fields)
        only_web = sorted(web_fields - local_fields)
        # 过滤掉不需要报告的网页字段（全部小写比较）
        only_web = [f for f in only_web if f.lower() not in IGNORE_WEB_FIELDS]
        if only_local or only_web:
            diff_lines.append(f"Class: {class_name}")
            for f in only_local:
                diff_lines.append(f"  此field只在本地: {f}")
            for f in only_web:
                diff_lines.append(f"  此field只在网页: {f}")

    return diff_lines


def main() -> None:
    init()
    if not os.path.exists(LOCAL_FILE_PATH):
        print(f"本地文件不存在: {LOCAL_FILE_PATH}")
        return

    print("解析本地文件...")
    local = analyze_file(LOCAL_FILE_PATH)

    print("从 triggerevent 页面抓取...")
    web_trigger = analyze_web(TRIGGER_EVENT_URL)

    print("从 componentevent 页面抓取...")
    web_component = analyze_web(COMPONENT_EVENT_URL)

    # 合并网页结果（可能包含不同 class）
    web_all: dict[str, list[str]] = {}
    for d in (web_trigger, web_component):
        for k, v in d.items():
            web_all.setdefault(k, []).extend(v)

    diff = compare_events(local, web_all)
    if not diff:
        print("没有不同之处，事件定义完全一致")
        return

    print("Differences found:")
    for line in diff:
        print(line)


if __name__ == "__main__":
    main()
