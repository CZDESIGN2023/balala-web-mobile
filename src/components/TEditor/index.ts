export const color_map = [
  '#ffffff',
  'White',
  '#1D74F5',
  '延展色/blue/700',
  '#FD4C4C',
  '延展色/red/400',
  '#08C479',
  '延展色/green/400',
  '#FFA723',
  '延展色/orange/400',
  '#7B1DF5',
  '延展色/purple/500',

  '#EDEEF0',
  '描边颜色/94',
  '#E3F2FF',
  '延展色/blue/50',
  '#FFEBEE',
  '延展色/red/50',
  '#E3F7EC',
  '延展色/green/50',
  '#FFF3E0',
  '延展色/green/50',
  '#F1E7FE',
  '延展色/purple/50',

  '#EDEEF0',
  '描边颜色/90',
  '#BBDFFF',
  '延展色/blue/100',
  '#FFCDD2',
  '延展色/red/100',
  '#BBEACF',
  '延展色/green/100',
  '#FFE0B2',
  '延展色/orange/100',
  '#DAC4FC',
  '延展色/purple/100',

  '#999999',
  '文本色/次要文字',
  '#2CA6FF',
  '延展色/blue/400',
  '#F27071',
  '延展色/red/300',
  '#56CF91',
  '延展色/green/300',
  '#FFB74B',
  '延展色/orange/300',
  '#924BF8',
  '延展色/purple/400',

  '#333333',
  '文本色/重要文字',
  '#2361E2',
  '延展色/blue/800',
  '#FF372E',
  '延展色/red/500',
  '#00B961',
  '延展色/green/500',
  '#FF9800',
  '延展色/orange/500',
  '#6F17EE',
  '延展色/purple/600',

  '#1A1A1A',
  '文本色/标题文字',
  '#293FC3',
  '延展色/blue/900',
  '#C60014',
  '延展色/red/900',
  '#006628',
  '延展色/green/900',
  '#E65000',
  '延展色/orange/900',
  '#2000DB',
  '延展色/purple/900',
]

export const alignStateMap = {
  alignLeft: false,
  alignCenter: false,
  alignRight: false,
}

export const fontStateMap = {
  H: false,
  H1: false,
  H2: false,
  H3: false,
  H4: false,
  H5: false,
}

export function updateItemActive(obj: any, key: string) {
  for (const i in obj) {
    if (key === i)
      obj[i] = true
    else
      obj[i] = false
  }
}
