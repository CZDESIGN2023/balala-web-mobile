import pinyin from 'pinyin'

export function useMatchKeyword(src: string, keyword: string) {
  const normal = cartesianProduct(pinyin(src, { style: pinyin.STYLE_NORMAL, heteronym: true })).flat().join('').toLocaleLowerCase()
  const firstLetter = cartesianProduct(pinyin(src, { style: pinyin.STYLE_FIRST_LETTER, heteronym: true })).flat().join('').toLocaleLowerCase()
  keyword = keyword.toLocaleLowerCase()
  return normal.includes(keyword) || firstLetter.includes(keyword) || src.includes(keyword)
}

function cartesianProduct(arr: any[][]): any[][] {
  function combine(arr1: any[], arr2: any[]) {
    const result = []
    for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
        result.push(arr1[i].concat(arr2[j]))
      }
    }
    return result
  }

  if (arr.length === 1) {
    return arr[0]
  }
  else {
    return combine(arr[0], cartesianProduct(arr.slice(1)))
  }
}
