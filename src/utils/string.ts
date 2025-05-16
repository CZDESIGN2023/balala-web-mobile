/**
 * 字符串工具
 */
class StringUtil {
  /**字符串替换*/
  public static substitute(str: string, ...rest: any[]): string {
    if (!str) return ''
    // Replace all of the parameters in the msg string.
    var len: number = rest.length
    var args: Array<string>
    //  有可能下面注释的才是对的  typeof 没法判断 array
    if (len == 1 && rest[0] instanceof Array) {
      // if (len == 1 && typeof rest[0] === "array") {
      args = rest[0]
      len = args.length
    } else {
      args = rest
    }
    for (var i: number = 0; i < len; i++) {
      str = str.replace(new RegExp('\\{' + i + '\\}', 'g'), args[i])
    }
    return str
  }
  /**字符串是否为空*/
  public static isEmpty(str: string): boolean {
    var pattern: RegExp = /^[ ]*$/
    str = str.replace(pattern, '')
    return !str || str.length == 0
  }
  /**去左右空格*/
  public static trim(char: string): string {
    return this.rtrim(this.ltrim(char))
  }
  /**去左空格*/
  public static ltrim(char: string): string {
    var pattern: RegExp = /^\s*/
    return char.replace(pattern, '')
  }
  /**去右空格*/
  public static rtrim(char: string): string {
    var pattern: RegExp = /\s*$/
    return char.replace(pattern, '')
  }
  /**是否为前缀字符串*/
  public static beginsWith(char: string, prefix: string): boolean {
    return prefix == char.substring(0, prefix.length)
  }
  /**是否为后缀字符串*/
  public static endsWith(char: string, suffix: string): boolean {
    return suffix == char.substring(char.length - suffix.length)
  }
  /**字符串补位，补充左边*/
  public static paddingLeft(str: string, char: string, len: number): string {
    var l: number = len - str.length
    if (l <= 0) {
      return str
    }
    str = String(str)
    //循环填充
    for (var i: number = 0; i < l; i++) {
      str = char + str
    }
    return str
  }

  public static stringToByte(str: string) {
    var bytes = new Array()
    var len, c
    len = str.length
    for (var i = 0; i < len; i++) {
      c = str.charCodeAt(i)
      if (c >= 0x010000 && c <= 0x10ffff) {
        bytes.push(((c >> 18) & 0x07) | 0xf0)
        bytes.push(((c >> 12) & 0x3f) | 0x80)
        bytes.push(((c >> 6) & 0x3f) | 0x80)
        bytes.push((c & 0x3f) | 0x80)
      } else if (c >= 0x000800 && c <= 0x00ffff) {
        bytes.push(((c >> 12) & 0x0f) | 0xe0)
        bytes.push(((c >> 6) & 0x3f) | 0x80)
        bytes.push((c & 0x3f) | 0x80)
      } else if (c >= 0x000080 && c <= 0x0007ff) {
        bytes.push(((c >> 6) & 0x1f) | 0xc0)
        bytes.push((c & 0x3f) | 0x80)
      } else {
        bytes.push(c & 0xff)
      }
    }
    return bytes
  }
}

export default StringUtil
