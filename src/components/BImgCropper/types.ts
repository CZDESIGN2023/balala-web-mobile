export interface Props {
  isShow: boolean
  headInfo: any
  cropBoxWidth: string
  cropBoxHeight: string
  autoCropWidth: any
  autoCropHeight: number
  fixedNumber: number[]
  autoCrop: boolean
  fixedBox: boolean
  centerBox: boolean
  canMove: boolean
  canMoveBox: boolean
  info: boolean
  full: boolean
  high: boolean
  mode: string
  isPreview: boolean
  maxImgSize: string | number
  title: string
  width: string
  canScale: boolean
  fixed: boolean
  enlarge: number
  original: boolean
}

export interface State {
  src: string
  isShowTip: boolean
  info: any
  dialogVisible: boolean
  scaleIndex: number
  previews: string
  loading: boolean
}
