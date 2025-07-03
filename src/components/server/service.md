## service
这里是server暴露的grpc服务端点
### Migrate 
Args:
1. batch: MigrateRequest
2. src_ranks: Vec<i32>
3. dst_ranks: Vec<i32>

向Prefill实例发送grpc请求。执行逻辑为向dst对应的tp_rank发送kv_cache。并free掉对应kv_cache在当前实例中的block(cache_manager)
### Immigrate
Args:
1. batch: MigrateRequest
2. src_ranks: Vec<i32>
3. dst_ranks: Vec<i32>

向Decode发送，从src_ranks中对应tp_rank的prefill处接收对应batch的kv_cache
### MigratePartial
在`Migrate`的基础上，新增Args
1. fst_or_snd
2. num_layer


### ImmitgratePartial
在`Immigrate`的基础上，新增Args
1. fst_or_snd
2. num_layer

### ResetStatus
将当对应replica的状态重置，主要是加载参数层数。这样能够让replica重新加载参数
### SetStatusReady
设置当前状态ready，主要是将embed，transformer和lm_head设为ready
### RdmaBroadcast
宏观上的行为是进行流式的链式多播
与下面的NvlBroadcast、TanzBroadcast都传入BroadcastRequest,返回BroadcastResponse
BroadcastRequest:
1. src_ranks: Vec<int32>
2. dst_ranks: Vec<int32>
链式传递参数，将src_rank[tp_rank]作为本组的源节点，dst中每隔tp_size取出节点组成一条链。
要确保当前replica在链中
如果replica是链的第一个节点，则send_params。否则recv_params。

send_params_in_chain会在新起的线程中依次对embed，所有的transformer和lm_head进行TcclChainMulticast.
recv_params_in_chain会新起一个线程，以此对embed，所有的transformer和lm_head也进行TcclChainMulticast

sender和recver的区别在于传入TcclChainMulticast的chain_index不同。如果chain中只有两个元素，那么TcclChainMulticast会退化为简单的p2p send和recv。否则会根据chain index,接收上一个节点的参数，并将参数传递给下一个节点。

由于这个链式broadcast的过程在新线程中完成，因此grpc会立即返回
### NvlBroadcast
同样根据传入的src_ranks和dst_ranks，构建所有broadcast涉及实例的ranks，在上锁param_guard后调用nccl_bcastor的nccl_broadcast方法，传入所有目标ranks以及预先建好的链
在nccl_bcastor内，通过work_item设置nlain = 0和dst_ranks来向后台线程传递参数，并通过notify_one唤醒后台线程
后台线程是在NcclBcastor初始化时新创建的线程。该线程首先通过init_p2p与相同机器上所有网卡通过ncclsend和ncclrecv进行一次通信，完成建链的过程，然后在循环中等待awaken唤醒，唤醒之后从work_item中取出参数
判断nlane是否为0
* 如果不为0，表示Tanz的多链All Gather过程。调用nccl_bcastor_edge_inner，对多个子链进行ring all gather。在这里All Gather将参数分割为chunk，每个chunk执行lane.size次send和recv，这样就能够保证对应的chunk被同步到了所有的机器。并循环将所有这样的chunk进行同步。在接收bytes超过embed、transformer layer的大小时设置ready/layer cnt，以通知等待的线程。
* 如果nlane == 0，表示单链广播，调用nccl_bcastor_edge_inner，传入chain表示链传播。简单的从上一个节点ncclrecv接收，并ncclsend发送到下一个节点
### TanzBroadcast
这是本论文/项目的主要贡献之一，充分利用了RDMA和NVLink的带宽
根据当前机器在src还是dst，有不同的行为。

如果是src，则创建出新线程进行rdma参数发送。因为存在多个src，因此每个src根据lane id发送不同的参数chunk，以链的形式作为链头发送。链中包含dst_ranks.size/src_ranks.size数量的dst。创建出多个handle进行TcclSend，达到handle上限时等待前序的handle完毕。lane id = 0时还需要发送最后一个剩余的chunk。

如果是dst，则首先进行rdma的链式recv + send，在这一步之后每组dst拥有一份chunk，不同组拥有不同的chunk。然后在dst_ranks内部含有不同chunk的dst之间进行tanz_broadcast。行为是进行all gather，将不同lane的chunk进行收集。
join创建出的线程，同步等待broadcast完成，再向client返回response。
### Relay
Args:
1. relax_not_head: bool
2. rank: int32

调用relay_zag_task在本replica的任务队列中查找可被抢占的任务
如果relax_not_head则抢占非队首任务即可，找到队列中第一个未完成的任务传递给peer。否则抢占队首任务直接pop给peer

### WaitRdmaDone
通过join param_thread来等待rdma参数传递结束
### zagPrefill
Args:
1. batch: Batch
2. forward_case: uint32
3. pp_info: optional<PipeParaInfo>
4. zag_layers: uint32
5. zag_seq_num: uint32

需要自旋等待取号锁将前序zag_task执行完毕，之后将请求的batch添加到zag_task中
### DecodeV2
Args:
1. batches: Vec<CachedBatch>
   1. id
   2. request_ids
   3. size
   4. max_tokens
2. last_iter_tokens: Vec<Tokens>
   1. ids
   2. logprobs
   3. texts
   4. is_special

Ret:
1. generations: Vec<Generation>
2. batch: optional<CachedBatch>
3. total_ns: uint64
遍历request中的每个batch，从本地cached_batches中查找对应的batch并更新token，将上次生成token追加到新token列表，如果本次decode涉及多个batch，那么会合并为一个大的batch。
更新完毕后执行forward推理，过程与PrefillV2类似。将forward返回结果插入到cached_batches中，并向调用者返回

### PrefillV2
Args:
1. batch: Batch
   1. id: uint64
   2. requests: Vec<Requests>
      1. id:
      2. inputs: string
      3. truncate: optional<uint32>
      4. parameters: optional<NextTokkenChooserParameters>
      5. stopping_parameters: StoppingCriteriaParameters
      6. prefill_logprobs: bool
      7. top_n_tokens: uint32
      8. input_tokens: Vec<uint32>
   3. size: uint32
   4. max_tokens: uint32
2. forward_case: uint32
3. pp_info: PipeParaInfo
4. pipe_peer: Vec<int32>

判断forward_case为PREFILL_CASE_NORMAL时,确认模型参数已经正确加载，并进行forward。
在forward时，首先分配page_table的mem，判断batch类型(prefill/decode)
对于prefill，需要将batch所有token都添加到buffer中，进行模型的forward。构造好用于embedding的token buffer，next_token_ids进行embed层的forward，如果tp还要进行allReduce，并进行transformer逐层的forward(attention + ffn)。最终
模型forward结束之后更新batch page_table的k v指针。最后一层时进行归一化，lm_head输出logits并进行采样，写入next_token_ids并将buffer中的新token添加到输出token中。

如果是NaivePP或者Immigrate。并且只执行部分层，写入部分kvcache。由于涉及到activation的转移，通过activation_manager加入到发送队列中
### LoadParams
Args:
1. LoadParamCase: enum(load_from_host_mem, load_from_disk)
2. model_name
3. model_path

根据LoadParamCase选择从磁盘(load_params_from_disk)还是内存中加载参数(load_params_from_host_memory)
从磁盘加载参数通过async创建异步的任务分段完成，并通过async的任务执行cudaMemcpyAsync、cudaStreamSynchronize
### RecvParams
Args: 
1. src

通过指定src，进行p2p的参数接收，不同层的参数以weight buffer的形式分段存储。
接收是异步进行的(创建新线程)，因此当前请求不会阻塞，而是立即返回OK
### SendParams
Args:
1. dst

通过指定dst，进行p2p的参数发送，每个层的参数以weight_buffer分段的方式通过TcclSend同步发送。在这里也是创建新线程执行发送，非阻塞的返回response。
### ClearCache
Args:
1. id: Optional uint64
指定batchid，释放掉对应的block和block_meta，将其从cached_batches中移除
### FilterBatch
1. batch_id: uint64
2. request_ids: Vec<uint64>

对给定的batch id，找到request_ids对应的request，释放其他request的block，并且同步更新tokens、page_tables、indices_2d等数据，将新的page table刷新到pinned memory
### Warmup
1. batch
2. max_input_length
3. max_prefill_tokens
4. max_total_tokens

在router对每个replica创建event_loop_inner时，发送warmup，进行replica的预热
执行时根据指定的max_input_length构建模拟的page_table，并执行一次模型的前向传播，结束时清理page table的显存占用。