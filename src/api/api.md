# API

modify_cluster_state_manually
## server
### Migrate 
Args:
1. batch: MigrateRequest
2. src_ranks: Vec<i32>
3. dst_ranks: Vec<i32>

向Prefill实例发送，向dst对应的tp_rank发送kv_cache。并free掉对应kv_cache在当前实例中的block(cache_manager)
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
### NvlBroadcast
### RdmaBroadcast
### TanzBroadcast
### Relay
### SetStatusReady
### WaitRdmaDone
### ZigzagPrefill
### DecodeV2
### PrefillV2
### LoadParams
Args:
1. LoadParamCase: enum(load_from_host_mem, load_from_disk)
2. model_name
3. model_path

根据LoadParamCase选择从磁盘(load_params_from_disk)还是内存中加载参数(load_params_from_host_memory)
### RecvParams
Args: 
1. src

通过指定src，进行p2p的参数接收。
接收是异步进行的(创建新线程)，因此当前请求不会阻塞，而是立即返回OK
### SendParams
Args:
1. dst

通过指定dst，进行p2p的参数发送，在这里也是非阻塞的。
### ClearCache
Args:
1. id: Optional uint64
指定batchid，释放掉对应的block和block_meta，将其从cached_batches中移除
### FilterBatch
1. batch_id: uint64
2. request_ids: Vec<uint64>

对给定的batch id，找到对应的