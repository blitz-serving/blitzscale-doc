## exec_blitz
对于传入的扩缩容计划，进行针对性的扩缩容，判断依据是prefill和decode各自的计划

1. 优先将Shutting副本转换为正常副本
2. 复用Null副本 避免冷启动
3. 带宽、拓扑感知的数据迁移
   1. 首先考虑节点内的扩容，nvlink broadcast
   2. 之后考虑节点间的扩容，使用rdma p2p/tanz或者rdma broadcast
4. 最后考虑直接新建、关闭副本

根据`(prefill_plan, decode_plan)`的不同执行不同的扩缩容计划

* (scaleup, scaleup): 先将shutting_decode/shutting_prefill副本转换为正常副本。如果还有需求就将shuted副本转换为prefill。如果支持nvlink，则通过steersman指定nvlink chain，通过chain进行nvlink scale。如果仍然无法满足需求，则进行rdma_sending。根据编译时feat选项的不同，使用live_p2p或tanz或rdma broadcast/p2p进行扩容

* (scaleup, stay): 首先将shutting_prefill转换为prefill，之后shutted转换为prefill。然后指定nvlink chain进行chain broadcast。最后进行节点间的扩容，通过p2p或者tanz/rdma broadcast完成

* (stay, scaleup): 将shutting_decode转换为decode，然后shutted转换为decode，之后进行nvlink broadcast节点内扩容。再进行节点间扩容

* (scaleup, scaledown): 需要将shutting prefill转换为prefill，shutted转换为prefill。将未使用的shuttingNull转换为inactive，通过向server发送reset_status grpc来实现。如果还需要扩容prefill，则考虑发送参数。

* (scaledown, scaleup): 将shutting decode转换为decode，shuttingnull转换为decode。然后进行节点内nvlink broadcast。与上面情况不同的是，此时可以将prefill转换为decode replica，直接复用prefill实例的参数，将prefil实例转换为mutatingToDecode实例。之后进行节点间扩容，使用rdma broadcast/p2p或者tanz进行参数传播。

* (stay, stay): 简单的判断shuttingNull关闭时间，并转换为Inactive

* (stay, scaledown): 将shuttingNull deactivate，如果仍然需要缩容，则将decode转变为shuttingdecode

* (scaledown, stay): 将shuttingNull deactivate，如果仍然需要缩容，则将prefill关闭为shuttingPrefill

* (scaledown, scaledown): 将shuttingNull deactivate，并关闭prefill和decode的实例