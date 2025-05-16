export interface Tip {
  left: string
  right: string
  type: string
  btn: string
}

export interface checkLoginPswTpy {
  [userName: string]: boolean
  nickName: boolean
  password: boolean
  confirmPassword: boolean
}
