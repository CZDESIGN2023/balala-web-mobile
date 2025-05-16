import type { App, Component } from 'vue'
import { SvgIcon } from './SvgIcon'
import { BEmpty } from './BEmpty'
import { BDialog } from './BDialog'
import { BEditor } from './BEditor'
import { BInputSelect } from './BInputSelect'
import { BMember } from './BMember'
import { BMemberList } from './BMemberList'
import { BMemberDialog } from './BMemberDialog'
import { BInputPriority } from './BInputPriority'
import { BTablePriority } from './BTablePriority'
import { BInputDate } from './BInputDate'
import { BFormUpload } from './BFormUpload'
import { BTag } from './BTag'
import { BHead } from './BHead'
import { BInput } from './BInput'
import { BEllipsis } from './BEllipsis'
import { BPopover } from './BTableElPopover'
import { BTablePopup } from './BTablePopup'
import cps from './autoImport'

const Components: {
  [propName: string]: Component
} = {
  SvgIcon,
  BEmpty,
  BDialog,
  BEditor,
  BInputSelect,
  BMember,
  BMemberList,
  BMemberDialog,
  BInputPriority,
  BTablePriority,
  BInputDate,
  BFormUpload,
  BTag,
  BHead,
  BInput,
  BEllipsis,
  BPopover,
  BTablePopup,
}

export default {
  install: (app: App) => {
    Object.keys(Components).forEach((key) => {
      app.component(key, Components[key])
    })

    Object.keys(cps).forEach((key) => {
      app.component(key, cps[key])
    })
  },
}
