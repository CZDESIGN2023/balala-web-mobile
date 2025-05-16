import { ObjectType, RelationType, TypeDesc } from './enum'
import type { NotificationData, ObjectData, Subject } from './type'
import { renderIcon } from './utils'

// 定义模板类型 Map
export const templateMaps = new Map()

// 评论相关模板
templateMaps.set(TypeDesc.AddCommentEvent, {
  render: (data: NotificationData) => {
    const { notification, relation, space } = data
    const { subject, object, describe } = notification

    // 渲染内容
    const renderContent = (subject?: Subject, object?: ObjectData, describe?: string) => {
      const suffix = relation.includes(RelationType.COMMENT_AT) ? ' 中@了你' : ' 中发布评论'
      return `
          <div class="b-notification-notice-content break-all text14 icon-color pfm">
            <p class="head mr16 break-all text14 icon-color pfm w224 line22">
              ${subject?.data.nickName}<span class="minor-color"> (${subject?.data.name}) </span>在 ${object?.data.name}${suffix}
            </p>
            <p class="body text14 icon-color mt6 ellipsis-desc w248 line22">
              ${describe}
            </p>
          </div>
        `
    }
    return {
      icon: () => renderIcon(data),
      description: () => renderContent(subject, object, describe),
      link: {
        type: 'comment',
        workItemId: object?.data.id,
        spaceId: space.spaceId,
        isChildTask: object?.data?.pid > 0,
      },
    }
  },
})

const workItemField = [
  TypeDesc.AddMember,
  TypeDesc.RemoveMember,
  TypeDesc.QuitSpace,
  TypeDesc.ChangeRole,
  TypeDesc.ChangeSpaceName,
  TypeDesc.ChangeSpaceDescribe,
  TypeDesc.DeleteSpace,
  TypeDesc.TransferSpace,
  TypeDesc.ChangeSpaceNotify,
  TypeDesc.RollbackWorkItem,
  TypeDesc.CloseWorkItem,
  TypeDesc.DeleteWorkItem,
  TypeDesc.TerminateWorkItem,
  TypeDesc.CompleteWorkItem,
  TypeDesc.RestartWorkItem,
  TypeDesc.ResumeWorkItem,
  TypeDesc.ChangeWorkItemField,
  TypeDesc.ChangeWorkItemDirector,
  TypeDesc.ChangeWorkItemTag,
  TypeDesc.CreateChildWorkItem,
  TypeDesc.ChangeWorkItemFlowNode,
  TypeDesc.SetWorkItemFile,
  TypeDesc.SetSpaceNotify,
  TypeDesc.SetSpaceWorkingDay,
  TypeDesc.SpaceAbnormal,
  TypeDesc.AddSpaceManager,
  TypeDesc.RemoveSpaceManager, // 移除空间管理员
  TypeDesc.CreateMemberCategory, // 创建自定义用户组
  TypeDesc.DeleteMemberCategory, // 移除自定义用户组
  TypeDesc.RemindWork,
  TypeDesc.TransferWorkItem,
  TypeDesc.ChangeWorkFlowNodePlanTime,
  TypeDesc.SetCommentDeletable,
  TypeDesc.CreateWorkFlow, // 创建流程
  TypeDesc.DeleteWorkFlow, // 删除流程
  TypeDesc.ChangeWorkFlowField, // 修改流程字段
  TypeDesc.SaveWorkFlowTemplate, // 保存流程模板
  TypeDesc.DisableWorkFlow, // 禁用任务流程
  TypeDesc.UpgradeWorkFlow,
]

// 工作项信息变更
workItemField.forEach((key) => {
  templateMaps.set(key, {
    render: (data: NotificationData) => {
      const { notification, space } = data
      const { object, describe } = notification

      // 渲染头部
      const renderTitle = (object?: ObjectData) => {
        const spaceName = space.spaceName
        const name = object?.data.name || ''

        return `
          <p class="head mr16 break-all text14 icon-color pfm flex-column-start w224 line22">
            ${name ? `${name}<p class="minor-color text14">${spaceName}</p>` : spaceName}
          </p>
        `
      }

      // 渲染内容
      const renderContent = (object?: ObjectData, describe?: string) => {
        // 任务相关
        const isWorkItem = object?.type === ObjectType.WORK_ITEM
        const titleHtml = isWorkItem ? renderTitle(object) : renderTitle()

        return `
          <div class="b-notification-notice-content break-all text14 icon-color pfm">
            ${titleHtml}
            <p class="body text14 icon-color mt6 ellipsis-desc w248 line22">
              ${describe}
            </p>
          </div>
        `
      }

      return {
        icon: () => renderIcon(data),
        description: () => renderContent(object, describe),
        link: {
          type: object?.type === ObjectType.SPACE ? 'space' : object?.type === ObjectType.WORK_FLOW ? 'flow' : 'task',
          workItemId: object?.data.id,
          spaceId: space.spaceId,
          isChildTask: object?.data?.pid > 0,
        },
      }
    },
  })
})

// 任务逾期
templateMaps.set(TypeDesc.WorkItemExpired, {
  render: (data: NotificationData) => {
    const { notification, space } = data
    const { subject, object, describe } = notification

    // 渲染内容
    const renderContent = (subject?: Subject, object?: ObjectData, describe?: string) => {
      return `
          <div class="b-notification-notice-content break-all text14 icon-color pfm">
            <p class="head mr16 break-all text14 icon-color pfm flex-column-start w224 line22">
              ${object?.data.name}
              <p class="minor-color text14">${space.spaceName}</p>
            </p>
            <p class="body text14 icon-color mt6 ellipsis-desc w248 line22">
              ${describe}
            </p>
          </div>
        `
    }

    return {
      icon: () => renderIcon(data),
      description: () => renderContent(subject, object, describe),
      link: {
        type: 'task',
        workItemId: object?.data.id,
        spaceId: space.spaceId,
        isChildTask: object?.data?.pid > 0,
      },
    }
  },
})
