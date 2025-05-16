import { templateMaps } from './template'
import type { NotificationData } from './type'

class NotificationTemplate {
  public data: NotificationData

  constructor(data: NotificationData) {
    this.data = data
  }

  renderNotification() {
    const { type, isPopup } = this.data
    const template = templateMaps.get(type).render(this.data)
    return {
      isPopup,
      icon: template.icon,
      description: template.description(),
      data: this.data,
      link: template.link,
    }
  }

  renderIcon() {}
}

export default NotificationTemplate
