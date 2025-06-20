 # 保存为 crc64.py
#!/usr/bin/env python3
import crcmod
import sys


def calc_crc64(filepath):
    do_crc64 = crcmod.mkCrcFun(
        0x142F0E1EBA9EA3693,  # 64-bit ECMA 多项式，带 leading 1（crcmod 要求）
        initCrc=0,
        xorOut=0xffffffffffffffff,
        rev=True
    )
    crc = 0
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            crc = do_crc64(chunk, crc)
    return crc


if __name__ == "__main__":
    checksum = calc_crc64(sys.argv[1])
    print(checksum)