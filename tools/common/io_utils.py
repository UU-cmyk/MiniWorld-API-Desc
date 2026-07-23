"""I/O 工具函数：初始化等"""

import sys
import io


def init_stdout() -> None:
    """初始化输出编码为 UTF-8"""
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
