"""处理 LuaLS 注释中的 @annotation 标记"""

import re

# 一次性匹配整行 LuaLS 注释
_LINE_RE = re.compile(
    r"^([ \t]*---[ \t]*)([^\r\n]*)(\r\n|\n|\r|$)",
    re.MULTILINE,
)
# 行首 @tag（如 @param / @return），连同尾随空白一起吃掉
_TAG_RE = re.compile(r"@\w+[ \t]*")


def _repl(m: re.Match[str]) -> str:
    """
    正则替换回调函数，用于清理匹配文本中的 @ 提及或标签
    Args:
        m (re.Match[str]): 正则匹配对象，必须包含至少 3 个捕获组
    Returns:
        str: 清理后的替换字符串，或空字符串（表示删除匹配）
    """
    body = m.group(2)

    if "@" in body:
        if body[0] == "@":
            tag = _TAG_RE.match(body)
            if tag is not None:
                body = body[tag.end() :]
        body = body.replace("@", "")

    return m.group(1) + body + m.group(3) if body.strip() else ""


def strip_annotations(content: str) -> str:
    """剔除 LuaLS 注释中的 @tag，并移除所有 @ 符号，清理空注释行
    Args:
        content: 原始文件内容
    Returns:
        str: 处理后的文件内容
    """
    return _LINE_RE.sub(_repl, content)
