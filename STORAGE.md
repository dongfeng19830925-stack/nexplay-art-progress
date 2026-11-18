# 道具协作存储

## 页面入口

- GitHub需求地图：requirements.html
- Nexplay道具协作台：https://www.nexplay.world/p/5073efe36816492e83ea9381b0ddf4bd
- target参数对应requirements.json的area-*或game-*编号。

## 分工

GitHub保存地图、静态文件和不含运行凭证的组件源码。道具标签嵌入Nexplay协作台，也提供新窗口入口。当前Nexplay API不允许GitHub域名跨域预检，所以写入请求在Nexplay同源页面内发出。

Pages实体5073efe36816492e83ea9381b0ddf4bd的content.catalog保存场所及游戏目录，content.props保存共享道具。使用Page内容版本和expected_content_revision实现更新冲突检查；这里使用共享Page内容，而不是按用户隔离的Page Data链。所有协作者看到相同清单。页面每30秒在没有未保存表单时刷新，也可手动刷新。

每条道具包含id、target、name、text、quantity、unit、images、updated_at、updated_by。提交者名称是用户填写的署名，不是经过验证的个人身份。编辑同条记录发生冲突时保留表单并要求重新载入；不同新增记录遇到409会重新合并一次。

图片存入OSS文件夹fc8729b2e60d4f30ae5e9afca2274e8c，按服务端返回id、url、size和folder_id记录，不使用文件名作唯一键。图片上传后，保存道具才完成关联。取消关联不删除OSS文件。

## 凭证与运行方式

用户明确授权在公开协作页运行Nexplay服务端AK。运行配置在发布Nexplay Page时注入window.NEXPLAY_STORAGE；GitHub组件源码保留配置读取逻辑。任何可访问该协作页的人都能在AK有效期内操作其授权接口。AK有效期、撤销与范围由Nexplay服务端决定，页面不伪造失效日期。更新或撤销后需要同步调整协作页配置。

## 验证

已完成接口读取、三张楼层图的OSS上传、浏览器内图片上传、道具文本数量保存、独立接口读回。联调测试记录已以is_del隐藏，并保留版本历史。图片支持JPEG/PNG/WebP/GIF，编辑器限制每张30MB；当前没有模型或Excel的上传表单。

维护Pages时须先读取当前content与content_revision，再保留props数据更新html；不得用空items覆盖团队已经保存的记录。


### 子页面管理调整
“道具设备”改为每个场所/游戏独立的清单文字说明和单个Excel附件，原设备需求作为未修改时的默认文本。记录保存在Pages的equipmentBriefs字段，附件上传OSS。“设计成果”改名“成果提交管理”，承接原协作台文字、数量、图片上传与剪贴板功能；既有props记录原样保留。第四标签保留需求源文件维护入口。多人修改同一清单时检查版本冲突。
