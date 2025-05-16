/**
 * 生成默认的节点数据对象
 * @param model 传入的数据对象，预期包含text和id属性
 * @returns 返回一个构造好的默认节点数据对象
 */
export function generateDefaultNodeData(model: any) {
  return {
    name: model.text,
    // 编码 系统预设 started 开始节点  ended 结束节点，除了开始和结束，随机一个值: node_${四个字母或拼音}
    key: model.id,
    // 节点被激活模式 pre_node_all_done 前置节点均完成
    startMode: 'pre_node_all_done', // 固定值
    // 流程开始的第一个节点 "started"
    belongStatus: 'started', // 固定值
    // 节点完成方式 是否需要指定负责人
    needDoneOperator: true, // 固定值
    // 节点完成方式可操作的相关角色 _node_owner 节点负责人 _space_manager 空间管理员 _creator 任务创建人 _space_editor 空间编辑人员   ["_node_owner", "_space_manager", "_creator", "_space_editor"]
    doneOperationRole: [], // 固定值
    // 流转按钮名称
    doneOperationDisplayName: '',
    // 节点完成模式 auto_confirm 自动完成[忽略角色，直接完成] single_user_confirm 单人完成(需配合角色控制) all_user_confirm 多人确认完成(所有节点负责人)
    // 开始和完成节点固定写 auto_confirm，其它固定写 single_user_confirm
    passMode: '',
    // 是否支持回滚
    enableRollback: false,
    enableCloseReasonOtherOption: true,
    enableRestartReasonOtherOption: true,
    enableRollbackReasonOtherOption: true,
    // 重启原因
    restartReasonOptions: model.restartReasonOptions,
    // 回滚原因选项
    rollbackReasonOptions: model.rollbackReasonOptions,
    // 是否可关闭/重启
    enableClose: false,
    // 关闭原因选项
    closeReasonOptions: model.closeReasonOptions,
    onReach: [
      {
        eventType: 'changeStoryStage',
        condition: null,
        targetSubState: {
          id: null,
          key: null,
          val: null,
        },
      },
    ],
    // 负责人分配方式
    owner: {
      // 是否必须需要负责人 固定 true
      forceOwner: true,
      // 负责人分配方式 none 不指定 appointed 指定负责人
      usageMode: 'none',
      // 存储一些特别条件的信息，比如默认指定负责人
      value: {
        // 不指定，默认填充填充成员
        // type值: 用户: user, 其它角色: role
        fillOwner: [],
        // 指定时: 可选成员范围
        appointedOwner: [],
      },
      // 关联角色
      ownerRole: [{
        id: null,
        key: null,
      }],
    },
  }
}
